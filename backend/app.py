from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

import os
import json
import tempfile
import subprocess
import re
import shutil
from pathlib import Path
from collections import defaultdict, Counter
import mimetypes
from datetime import datetime
import io
import csv

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

app = Flask(__name__)
CORS(app)

BUILD_DIR = os.path.join(os.path.dirname(__file__), "dist")

app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app, origins=['http://localhost:3000'])

# Database Models
class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    repository_url = db.Column(db.String(500), nullable=False)
    repository_name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    files_scanned = db.Column(db.Integer, default=0)
    lines_of_code = db.Column(db.Integer, default=0)
    risk_score = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text)

class Finding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scan.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    line_number = db.Column(db.Integer)
    code_snippet = db.Column(db.Text)
    recommendation = db.Column(db.Text)
    cve_id = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ScanMetadata(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scan.id'), nullable=False)
    language_distribution = db.Column(db.Text)
    file_types = db.Column(db.Text)
    total_files = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Vulnerability Scanner Class
class VulnerabilityScanner:
    def __init__(self):
        self.security_patterns = {
            'CRITICAL': [
                (r'eval\s*\(', 'Code Injection via eval()', 'Avoid using eval() with user input'),
                (r'exec\s*\(', 'Code Injection via exec()', 'Avoid using exec() with user input'),
                (r'subprocess\.call\s*\([^)]*shell\s*=\s*True', 'Command Injection', 'Avoid shell=True in subprocess'),
                (r'os\.system\s*\(', 'Command Injection via os.system', 'Use subprocess with proper escaping'),
                (r'pickle\.loads?\s*\(', 'Insecure Deserialization', 'Use safe serialization methods'),
            ],
            'HIGH': [
                (r'password\s*=\s*["\'][^"\']+["\']', 'Hardcoded Password', 'Store passwords in environment variables'),
                (r'api[_-]?key\s*=\s*["\'][^"\']+["\']', 'Hardcoded API Key', 'Store API keys in environment variables'),
                (r'secret[_-]?key\s*=\s*["\'][^"\']+["\']', 'Hardcoded Secret', 'Use secure secret management'),
                (r'SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+', 'Potential SQL Injection', 'Use parameterized queries'),
                (r'innerHTML\s*=\s*.*\+', 'Potential XSS', 'Use safe DOM manipulation methods'),
            ],
            'MEDIUM': [
                (r'TODO.*security', 'Security TODO', 'Complete security-related TODO items'),
                (r'FIXME.*security', 'Security FIXME', 'Address security-related FIXME items'),
                (r'http://', 'Insecure HTTP', 'Use HTTPS instead of HTTP'),
                (r'md5\s*\(', 'Weak Hash Algorithm', 'Use SHA-256 or stronger'),
                (r'sha1\s*\(', 'Weak Hash Algorithm', 'Use SHA-256 or stronger'),
            ],
            'LOW': [
                (r'console\.log\s*\(', 'Information Disclosure', 'Remove console.log in production'),
                (r'print\s*\(', 'Information Disclosure', 'Remove debug prints in production'),
                (r'alert\s*\(', 'Information Disclosure', 'Remove alert() in production'),
                (r'#.*TODO', 'General TODO', 'Complete pending tasks'),
            ]
        }

        self.language_extensions = {
            '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript', '.java': 'Java',
            '.c': 'C', '.cpp': 'C++', '.cs': 'C#', '.php': 'PHP', '.rb': 'Ruby',
            '.go': 'Go', '.rs': 'Rust', '.swift': 'Swift', '.kt': 'Kotlin',
            '.scala': 'Scala', '.html': 'HTML', '.css': 'CSS', '.sql': 'SQL'
        }

    def scan_repository(self, repository_url):
        temp_dir = None
        try:
            temp_dir = tempfile.mkdtemp()
            clone_result = self._clone_repository(repository_url, temp_dir)
            if not clone_result['success']:
                return clone_result

            repo_path = clone_result['repo_path']
            analysis_result = self._analyze_repository(repo_path)
            
            return {
                'success': True,
                'files_scanned': analysis_result['files_scanned'],
                'lines_of_code': analysis_result['lines_of_code'],
                'findings': analysis_result['findings'],
                'language_distribution': analysis_result['language_distribution'],
                'file_types': analysis_result['file_types'],
                'risk_score': analysis_result['risk_score']
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}
        finally:
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

    def _clone_repository(self, repository_url, temp_dir):
        try:
            repo_name = repository_url.split('/')[-1].replace('.git', '')
            repo_path = os.path.join(temp_dir, repo_name)
            
            result = subprocess.run(
                ['git', 'clone', '--depth', '1', repository_url, repo_path],
                capture_output=True, text=True, timeout=300
            )
            
            if result.returncode != 0:
                return {'success': False, 'error': f'Failed to clone repository: {result.stderr}'}
            
            return {'success': True, 'repo_path': repo_path}
            
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': 'Repository cloning timed out'}
        except FileNotFoundError:
            return {'success': False, 'error': 'Git is not installed on the system'}
        except Exception as e:
            return {'success': False, 'error': f'Clone error: {str(e)}'}

    def _analyze_repository(self, repo_path):
        findings = []
        files_scanned = 0
        lines_of_code = 0
        language_counter = Counter()
        file_type_counter = Counter()

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv', 'env']]
            
            for file in files:
                if file.startswith('.'):
                    continue
                    
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, repo_path)
                
                _, ext = os.path.splitext(file)
                ext = ext.lower()
                
                if ext:
                    file_type_counter[ext] += 1
                    if ext in self.language_extensions:
                        language_counter[self.language_extensions[ext]] += 1

                if self._is_text_file(file_path):
                    files_scanned += 1
                    file_findings = self._scan_file(file_path, relative_path)
                    findings.extend(file_findings)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines_of_code += sum(1 for line in f if line.strip())
                    except:
                        pass

        risk_score = self._calculate_risk_score(findings)
        language_distribution = dict(language_counter.most_common(10))

        return {
            'files_scanned': files_scanned,
            'lines_of_code': lines_of_code,
            'findings': findings,
            'language_distribution': language_distribution,
            'file_types': dict(file_type_counter.most_common(10)),
            'risk_score': risk_score
        }

    def _scan_file(self, file_path, relative_path):
        findings = []
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
            for line_number, line in enumerate(lines, 1):
                line_content = line.strip()
                if not line_content or line_content.startswith('#') or line_content.startswith('//'):
                    continue
                
                for severity, patterns in self.security_patterns.items():
                    for pattern, title, recommendation in patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            findings.append({
                                'title': title,
                                'description': f'Potential security issue found in {relative_path}',
                                'severity': severity,
                                'file_path': relative_path,
                                'line_number': line_number,
                                'code_snippet': line_content,
                                'recommendation': recommendation
                            })
        except Exception:
            pass
        return findings

    def _is_text_file(self, file_path):
        try:
            source_extensions = {'.py', '.js', '.ts', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html', '.css', '.sql', '.sh', '.ps1', '.xml', '.json', '.yaml', '.yml', '.md', '.txt'}
            _, ext = os.path.splitext(file_path.lower())
            
            if ext in source_extensions:
                return True
                
            mime_type, _ = mimetypes.guess_type(file_path)
            return mime_type and mime_type.startswith('text')
        except:
            return False

    def _calculate_risk_score(self, findings):
        if not findings:
            return 0
            
        severity_weights = {'CRITICAL': 40, 'HIGH': 25, 'MEDIUM': 10, 'LOW': 5}
        total_weight = sum(severity_weights.get(finding['severity'], 0) for finding in findings)
        max_possible = len(findings) * 40
        
        if max_possible == 0:
            return 0
            
        risk_score = min(100, int((total_weight / max_possible) * 100))
        return risk_score

@app.route("/api/health")
def health():
    return jsonify({"status": "Backend is running"})

@app.route('/api/scan', methods=['POST'])
def start_scan():
    try:
        data = request.get_json()
        repository_url = data.get('repositoryUrl', '').strip()
        
        if not repository_url:
            return jsonify({'success': False, 'message': 'Repository URL is required'}), 400

        if 'github.com' not in repository_url:
            return jsonify({'success': False, 'message': 'Please provide a valid GitHub repository URL'}), 400

        repo_name = repository_url.split('/')[-1].replace('.git', '')
        
        scan = Scan(repository_url=repository_url, repository_name=repo_name, status='scanning')
        db.session.add(scan)
        db.session.commit()

        scanner = VulnerabilityScanner()
        scan_result = scanner.scan_repository(repository_url)

        if scan_result['success']:
            scan.status = 'completed'
            scan.completed_at = datetime.utcnow()
            scan.files_scanned = scan_result['files_scanned']
            scan.lines_of_code = scan_result['lines_of_code']
            scan.risk_score = scan_result['risk_score']
            
            for finding_data in scan_result['findings']:
                finding = Finding(
                    scan_id=scan.id,
                    title=finding_data['title'],
                    description=finding_data['description'],
                    severity=finding_data['severity'],
                    file_path=finding_data['file_path'],
                    line_number=finding_data['line_number'],
                    code_snippet=finding_data['code_snippet'],
                    recommendation=finding_data['recommendation']
                )
                db.session.add(finding)

            metadata = ScanMetadata(
                scan_id=scan.id,
                language_distribution=json.dumps(scan_result['language_distribution']),
                file_types=json.dumps(scan_result['file_types']),
                total_files=scan_result['files_scanned']
            )
            db.session.add(metadata)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Scan completed successfully',
                'scanId': scan.id,
                'data': {
                    'repositoryName': repo_name,
                    'filesScanned': scan_result['files_scanned'],
                    'linesOfCode': scan_result['lines_of_code'],
                    'riskScore': scan_result['risk_score'],
                    'totalFindings': len(scan_result['findings'])
                }
            })
        else:
            scan.status = 'failed'
            scan.error_message = scan_result['error']
            db.session.commit()
            return jsonify({'success': False, 'message': f'Scan failed: {scan_result["error"]}'}), 500

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error during scan: {str(e)}'}), 500

@app.route('/api/dashboard/current')
def get_current_dashboard():
    try:
        latest_scan = Scan.query.filter_by(status='completed').order_by(Scan.created_at.desc()).first()
        
        if not latest_scan:
            return jsonify({
                'success': False,
                'message': 'No scan data available. Please scan a repository first.',
                'data': None
            }), 404

        findings = Finding.query.filter_by(scan_id=latest_scan.id).all()
        metadata = ScanMetadata.query.filter_by(scan_id=latest_scan.id).first()

        severity_counts = {
            'critical': len([f for f in findings if f.severity == 'CRITICAL']),
            'high': len([f for f in findings if f.severity == 'HIGH']),
            'medium': len([f for f in findings if f.severity == 'MEDIUM']),
            'low': len([f for f in findings if f.severity == 'LOW'])
        }

        language_split = {}
        if metadata and metadata.language_distribution:
            language_split = json.loads(metadata.language_distribution)

        severity_trends = [
            {'month': 'Jan', 'critical': 5, 'high': 12, 'medium': 20, 'low': 8},
            {'month': 'Feb', 'critical': 3, 'high': 15, 'medium': 25, 'low': 10},
            {'month': 'Mar', 'critical': severity_counts['critical'], 'high': severity_counts['high'], 
             'medium': severity_counts['medium'], 'low': severity_counts['low']}
        ]

        formatted_findings = []
        for finding in findings[:10]:
            formatted_findings.append({
                'id': finding.id,
                'issue': finding.title,
                'severity': finding.severity,
                'filePath': finding.file_path,
                'lineNumber': finding.line_number,
                'description': finding.description,
                'recommendation': finding.recommendation
            })

        return jsonify({
            'success': True,
            'data': {
                'projectName': latest_scan.repository_name,
                'scanDate': latest_scan.created_at.strftime('%d/%m/%Y'),
                'filesScanned': latest_scan.files_scanned,
                'linesOfCode': latest_scan.lines_of_code,
                'riskScore': latest_scan.risk_score,
                'totalFindings': len(findings),
                'criticalThreats': severity_counts['critical'],
                'languageSplit': language_split,
                'severityTrends': severity_trends,
                'severityCounts': severity_counts,
                'findings': formatted_findings,
                'totalFindingsCount': len(findings),
                'scanId': latest_scan.id
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/scan/<int:scan_id>/findings')
def get_all_findings(scan_id):
    try:
        findings = Finding.query.filter_by(scan_id=scan_id).all()
        findings_data = [{
            'id': f.id, 'title': f.title, 'description': f.description,
            'severity': f.severity, 'filePath': f.file_path, 'lineNumber': f.line_number,
            'codeSnippet': f.code_snippet, 'recommendation': f.recommendation
        } for f in findings]
        
        return jsonify({'success': True, 'data': findings_data, 'total': len(findings_data)})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/scan/<int:scan_id>/download/pdf')
def download_pdf_report(scan_id):
    try:
        scan = Scan.query.get_or_404(scan_id)
        findings = Finding.query.filter_by(scan_id=scan_id).all()

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, height - 100, f"Security Report - {scan.repository_name}")
        
        p.setFont("Helvetica", 12)
        y_pos = height - 140
        p.drawString(100, y_pos, f"Scan Date: {scan.created_at.strftime('%d/%m/%Y')}")
        y_pos -= 20
        p.drawString(100, y_pos, f"Files: {scan.files_scanned} | Lines: {scan.lines_of_code} | Risk: {scan.risk_score}")
        y_pos -= 40

        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y_pos, "Findings:")
        y_pos -= 20

        for finding in findings[:15]:
            p.setFont("Helvetica-Bold", 10)
            p.drawString(120, y_pos, f"• {finding.title} ({finding.severity})")
            y_pos -= 15
            p.setFont("Helvetica", 8)
            p.drawString(140, y_pos, f"{finding.file_path}:{finding.line_number}")
            y_pos -= 20
            if y_pos < 100:
                p.showPage()
                y_pos = height - 100

        p.save()
        buffer.seek(0)

        return send_file(
            io.BytesIO(buffer.read()),
            as_attachment=True,
            download_name=f"scan_report_{scan.repository_name}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan/<int:scan_id>/download/csv')
def download_csv_report(scan_id):
    try:
        findings = Finding.query.filter_by(scan_id=scan_id).all()
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Title', 'Severity', 'File', 'Line', 'Description', 'Recommendation'])
        for f in findings:
            writer.writerow([f.title, f.severity, f.file_path, f.line_number, f.description, f.recommendation])

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            as_attachment=True,
            download_name=f"scan_report_{scan_id}.csv",
            mimetype='text/csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    full_path = os.path.join(BUILD_DIR, path)
    if path != "" and os.path.exists(full_path):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, "index.html")

