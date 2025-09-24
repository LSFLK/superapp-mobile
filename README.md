# Payslip Service

A microservice for managing employee payslips.  
Supports JWT-based authentication, CSV upload for bulk payslips, health checks, and admin-specific endpoints.

<p align="left">
  <a href="https://opensource.org/license/apache-2-0">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg">
  </a>
</p>

## Features

- Fetch the latest payslip for an employee.
- Fetch all payslips (general and admin views).
- Upload CSV to insert multiple payslips in bulk.
- JWT-based authentication and role-based access.
- Health check endpoints.
- Configurable via TOML file or environment variables.
- Graceful shutdown and logging.

---

## Project Overview

Full documentation is in [payslip-viewer/backend/README.md](payslip-viewer/backend/README.md).
