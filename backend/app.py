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
from collections import Counter
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

# -------------------- MODELS --------------------

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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ScanMetadata(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scan.id'), nullable=False)
    language_distribution = db.Column(db.Text)
    file_types = db.Column(db.Text)
    total_files = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# -------------------- HEALTH --------------------

@app.route("/api/health")
def health():
    return jsonify({"status": "Backend is running"})

# -------------------- SCAN (DEMO SAFE) --------------------

@app.route('/api/scan', methods=['POST'])
def start_scan():
    try:
        # ===== DEMO SAFE SHORT-CIRCUIT (Render friendly) =====
        return jsonify({
            "success": True,
            "message": "Demo scan completed successfully",
            "scanId": 1,
            "data": {
                "repositoryName": "demo-repository",
                "filesScanned": 25,
                "linesOfCode": 1200,
                "riskScore": 35,
                "totalFindings": 6
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# -------------------- DASHBOARD --------------------

@app.route('/api/dashboard/current')
def get_current_dashboard():
    return jsonify({
        "success": True,
        "data": {
            "projectName": "demo-repository",
            "scanDate": datetime.utcnow().strftime('%d/%m/%Y'),
            "filesScanned": 25,
            "linesOfCode": 1200,
            "riskScore": 35,
            "totalFindings": 6,
            "criticalThreats": 1,
            "languageSplit": {
                "JavaScript": 10,
                "Python": 5
            },
            "severityTrends": [
                {"month": "Jan", "critical": 1, "high": 2, "medium": 2, "low": 1}
            ],
            "severityCounts": {
                "critical": 1,
                "high": 2,
                "medium": 2,
                "low": 1
            },
            "findings": [
                {
                    "id": 1,
                    "issue": "Hardcoded Secret",
                    "severity": "HIGH",
                    "filePath": "config.js",
                    "lineNumber": 12,
                    "description": "Hardcoded secret found",
                    "recommendation": "Move secrets to env variables"
                }
            ],
            "scanId": 1
        }
    })

# -------------------- DOWNLOADS --------------------

@app.route('/api/scan/<int:scan_id>/download/pdf')
def download_pdf_report(scan_id):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "Demo Security Report")
    p.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="demo_report.pdf",
        mimetype='application/pdf'
    )

@app.route('/api/scan/<int:scan_id>/download/csv')
def download_csv_report(scan_id):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Title', 'Severity', 'File', 'Line'])
    writer.writerow(['Hardcoded Secret', 'HIGH', 'config.js', '12'])
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        as_attachment=True,
        download_name="demo_report.csv",
        mimetype='text/csv'
    )

# -------------------- FRONTEND SERVE --------------------

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    full_path = os.path.join(BUILD_DIR, path)
    if path and os.path.exists(full_path):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, "index.html")

# -------------------- MAIN --------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
