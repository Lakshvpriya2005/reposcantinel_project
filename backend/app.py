from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import os, io, csv
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

app = Flask(__name__)
CORS(app)

# -------------------- FRONTEND BUILD --------------------
BUILD_DIR = os.path.join(os.path.dirname(__file__), "dist")

# -------------------- HEALTH --------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "Backend running (demo mode)"})

# -------------------- SCAN (MOCK, SAFE) --------------------
@app.route("/api/scan", methods=["POST"])
def scan():
    data = request.get_json()
    repo = data.get("repositoryUrl", "demo-repo")

    return jsonify({
        "success": True,
        "message": "Scan completed successfully",
        "scanId": 1,
        "data": {
            "repositoryName": repo.split("/")[-1],
            "filesScanned": 34,
            "linesOfCode": 1820,
            "riskScore": 42,
            "totalFindings": 7
        }
    })

# -------------------- DASHBOARD (ALWAYS WORKS) --------------------
@app.route("/api/dashboard/current")
def dashboard():
    return jsonify({
        "success": True,
        "data": {
            "projectName": "Demo Repository",
            "scanDate": datetime.utcnow().strftime("%d/%m/%Y"),
            "filesScanned": 34,
            "linesOfCode": 1820,
            "riskScore": 42,
            "totalFindings": 7,
            "criticalThreats": 1,
            "languageSplit": {
                "Python": 12,
                "JavaScript": 8,
                "TypeScript": 5
            },
            "severityCounts": {
                "critical": 1,
                "high": 2,
                "medium": 3,
                "low": 1
            },
            "severityTrends": [
                {"month": "Jan", "critical": 1, "high": 2, "medium": 3, "low": 1}
            ],
            "findings": [
                {
                    "id": 1,
                    "issue": "Hardcoded Secret",
                    "severity": "HIGH",
                    "filePath": "config.js",
                    "lineNumber": 21,
                    "description": "Sensitive key hardcoded in source",
                    "recommendation": "Use environment variables"
                },
                {
                    "id": 2,
                    "issue": "Use of eval()",
                    "severity": "CRITICAL",
                    "filePath": "utils.py",
                    "lineNumber": 88,
                    "description": "eval() can lead to code execution",
                    "recommendation": "Avoid eval usage"
                }
            ],
            "scanId": 1
        }
    })

# -------------------- DOWNLOAD PDF --------------------
@app.route("/api/scan/<int:scan_id>/download/pdf")
def pdf(scan_id):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "RepoScantinel – Demo Report")
    p.setFont("Helvetica", 12)
    p.drawString(100, 720, "Findings: 7 | Risk Score: 42")
    p.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True,
                     download_name="demo_report.pdf",
                     mimetype="application/pdf")

# -------------------- DOWNLOAD CSV --------------------
@app.route("/api/scan/<int:scan_id>/download/csv")
def csv_report(scan_id):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Issue", "Severity", "File"])
    writer.writerow(["Hardcoded Secret", "HIGH", "config.js"])
    writer.writerow(["Use of eval()", "CRITICAL", "utils.py"])

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        as_attachment=True,
        download_name="demo_report.csv",
        mimetype="text/csv"
    )

# -------------------- SERVE FRONTEND --------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path):
    full = os.path.join(BUILD_DIR, path)
    if path and os.path.exists(full):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, "index.html")
