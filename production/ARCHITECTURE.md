# ICP Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │    Mobile    │  │   Tablet     │         │
│  │  (Desktop)   │  │   (Phone)    │  │   (iPad)     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTPS/HTTP (REST API)
                             │
┌─────────────────────────────┼─────────────────────────────────┐
│                    Nginx Reverse Proxy                         │
│                    (Port 80/443)                               │
│  • SSL/TLS Termination                                         │
│  • Load Balancing                                              │
│  • Static File Serving                                         │
│  • Request Routing                                             │
└─────────────────────────────┬─────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
┌─────────────▼──────────────┐  ┌────────────▼─────────────┐
│     Frontend Container     │  │    Backend Container     │
│                            │  │                          │
│  ┌──────────────────────┐  │  │  ┌────────────────────┐ │
│  │   React 19.0.0       │  │  │  │   PHP 8.2-FPM      │ │
│  │   + Vite             │  │  │  │   + Nginx          │ │
│  │   + Tailwind CSS     │  │  │  │   + Supervisor     │ │
│  │   + React Router     │  │  │  │                    │ │
│  └──────────────────────┘  │  │  │  ┌──────────────┐  │ │
│                            │  │  │  │ JWT Auth     │  │ │
│  Nginx (Port 80)           │  │  │  │ REST API     │  │ │
│  • Gzip Compression        │  │  │  │ File Upload  │  │ │
│  • Cache Headers           │  │  │  │ PDF Gen      │  │ │
│  • SPA Routing             │  │  │  └──────────────┘  │ │
│                            │  │  │                    │ │
└────────────────────────────┘  │  │  Port 8080         │ │
                                │  │  • OPcache         │ │
                                │  │  • Session Mgmt    │ │
                                │  │  • Error Logging   │ │
                                │  └────────┬───────────┘ │
                                └───────────┼─────────────┘
                                            │
                                       PDO/MySQL
                                            │
                        ┌───────────────────▼───────────────────┐
                        │      Database Container               │
                        │                                       │
                        │  ┌─────────────────────────────────┐  │
                        │  │      MySQL 8.0                  │  │
                        │  │                                 │  │
                        │  │  • UTF-8 Character Set          │  │
                        │  │  • InnoDB Engine                │  │
                        │  │  • Foreign Key Constraints      │  │
                        │  │  • Indexed Queries              │  │
                        │  │  • Binary Logging               │  │
                        │  └─────────────────────────────────┘  │
                        │                                       │
                        │  Port 3306 (Internal Only)            │
                        │  Persistent Volume: db_data           │
                        └───────────────────────────────────────┘
```

## Docker Container Architecture

### Container Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network: icp_network                  │
│                         (Bridge Mode)                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Nginx      │───▶│   Frontend   │    │   Backend    │     │
│  │   Proxy      │    │   Container  │◀───│   Container  │     │
│  │              │    │              │    │              │     │
│  │  Port: 80    │    │  Port: 80    │    │  Port: 8080  │     │
│  │  Port: 443   │    │              │    │              │     │
│  └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                  │             │
│                                                  │             │
│                                          ┌───────▼───────┐     │
│                                          │   Database    │     │
│                                          │   Container   │     │
│                                          │               │     │
│                                          │  Port: 3306   │     │
│                                          └───────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Volume Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Volumes                             │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   db_data        │  │ backend_uploads  │                    │
│  │                  │  │                  │                    │
│  │  MySQL Data      │  │  • Profiles      │                    │
│  │  Files           │  │  • Receipts      │                    │
│  │                  │  │  • Assignments   │                    │
│  │  Persistent      │  │  • Materials     │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                              │
│           │                     │                              │
│  ┌────────▼─────────┐  ┌────────▼─────────┐                    │
│  │   Database       │  │    Backend       │                    │
│  │   Container      │  │    Container     │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  backend_logs    │  │   nginx_logs     │                    │
│  │                  │  │                  │                    │
│  │  • PHP Errors    │  │  • Access Logs   │                    │
│  │  • App Logs      │  │  • Error Logs    │                    │
│  │  • PHP-FPM Logs  │  │                  │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                              │
│  ┌────────▼─────────┐  ┌────────▼─────────┐                    │
│  │    Backend       │  │     Nginx        │                    │
│  │    Container     │  │     Container    │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ username    │
│ password    │
│ email       │
│ role        │
│ status      │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
┌──────▼──────┐  ┌──────────────┐  ┌─────▼──────┐
│  students   │  │   teachers   │  │   admins   │
│─────────────│  │──────────────│  │────────────│
│ id (PK)     │  │ id (PK)      │  │ id (PK)    │
│ user_id(FK) │  │ user_id (FK) │  │ user_id(FK)│
│ student_id  │  │ teacher_id   │  │ admin_id   │
│ session_id  │  │ department   │  │ permissions│
│ semester    │  └──────────────┘  └────────────┘
└──────┬──────┘
       │
       ├────────────────┬────────────────┬──────────────┐
       │                │                │              │
┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐  ┌───▼────────┐
│    marks    │  │ attendance  │  │  payments  │  │  sessions  │
│─────────────│  │─────────────│  │────────────│  │────────────│
│ id (PK)     │  │ id (PK)     │  │ id (PK)    │  │ id (PK)    │
│ student_id  │  │ student_id  │  │ student_id │  │ session_   │
│ subject_id  │  │ subject_id  │  │ fee_id     │  │   name     │
│ session_id  │  │ session_id  │  │ amount     │  │ is_active  │
│ semester    │  │ date        │  │ receipt_no │  └────────────┘
│ total_marks │  │ status      │  └────────────┘
└─────────────┘  └─────────────┘
       │
       │
┌──────▼──────┐
│  subjects   │
│─────────────│
│ id (PK)     │
│ subject_code│
│ subject_name│
│ credit_hours│
│ semester    │
└─────────────┘
```

## Request Flow

### Authentication Flow

```
┌─────────┐                                              ┌─────────┐
│ Client  │                                              │ Backend │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │  POST /api/auth/login.php                             │
     │  { username, password }                               │
     ├──────────────────────────────────────────────────────▶│
     │                                                        │
     │                                        Validate        │
     │                                        Credentials     │
     │                                        ┌──────────┐    │
     │                                        │ Database │    │
     │                                        └────┬─────┘    │
     │                                             │          │
     │                                        Query User      │
     │                                        ◀───┘          │
     │                                                        │
     │                                        Generate JWT    │
     │                                        Token           │
     │                                                        │
     │  200 OK                                                │
     │  { token, user, role }                                 │
     │◀──────────────────────────────────────────────────────┤
     │                                                        │
     │  Store token in localStorage                           │
     │                                                        │
     │  GET /api/student/profile.php                          │
     │  Authorization: Bearer <token>                         │
     ├──────────────────────────────────────────────────────▶│
     │                                                        │
     │                                        Verify JWT      │
     │                                        Token           │
     │                                                        │
     │                                        Fetch Data      │
     │                                        ┌──────────┐    │
     │                                        │ Database │    │
     │                                        └────┬─────┘    │
     │                                             │          │
     │                                        Query Profile   │
     │                                        ◀───┘          │
     │                                                        │
     │  200 OK                                                │
     │  { profile data }                                      │
     │◀──────────────────────────────────────────────────────┤
     │                                                        │
```

### File Upload Flow

```
┌─────────┐                                              ┌─────────┐
│ Client  │                                              │ Backend │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │  POST /api/student/upload-profile.php                 │
     │  Content-Type: multipart/form-data                    │
     │  Authorization: Bearer <token>                        │
     │  { file: image.jpg }                                  │
     ├──────────────────────────────────────────────────────▶│
     │                                                        │
     │                                        Verify JWT      │
     │                                        Token           │
     │                                                        │
     │                                        Validate File   │
     │                                        • Type          │
     │                                        • Size          │
     │                                        • Extension     │
     │                                                        │
     │                                        Process Image   │
     │                                        • Resize        │
     │                                        • Optimize      │
     │                                                        │
     │                                        Save to Volume  │
     │                                        /uploads/       │
     │                                        profiles/       │
     │                                                        │
     │                                        Update DB       │
     │                                        ┌──────────┐    │
     │                                        │ Database │    │
     │                                        └────┬─────┘    │
     │                                             │          │
     │                                        Update Path     │
     │                                        ◀───┘          │
     │                                                        │
     │  200 OK                                                │
     │  { url, message }                                      │
     │◀──────────────────────────────────────────────────────┤
     │                                                        │
```

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloud Provider                          │
│                    (AWS / Azure / GCP / VPS)                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Load Balancer                          │  │
│  │                  (Optional - for scaling)                 │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                   Docker Host Server                      │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │           Docker Compose Stack                      │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │  │
│  │  │  │  Nginx   │  │ Frontend │  │ Backend  │         │  │  │
│  │  │  │  Proxy   │  │Container │  │Container │         │  │  │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │  │  │
│  │  │       │             │             │               │  │  │
│  │  │       └─────────────┴─────────────┘               │  │  │
│  │  │                     │                             │  │  │
│  │  │              ┌──────▼──────┐                      │  │  │
│  │  │              │  Database   │                      │  │  │
│  │  │              │  Container  │                      │  │  │
│  │  │              └─────────────┘                      │  │  │
│  │  │                                                   │  │  │
│  │  │  Volumes:                                         │  │  │
│  │  │  • db_data (Persistent)                           │  │  │
│  │  │  • backend_uploads (Persistent)                   │  │  │
│  │  │  • backend_logs (Persistent)                      │  │  │
│  │  │  • nginx_logs (Persistent)                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Monitoring (Optional):                                   │  │
│  │  • Prometheus                                             │  │
│  │  • Grafana                                                │  │
│  │  • cAdvisor                                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Backup Storage:                                                │
│  • Automated daily backups                                      │
│  • Off-site backup storage                                      │
│  • Retention policy: 30 days                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                            │
│                                                                 │
│  Layer 1: Network Security                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Firewall Rules                                         │  │
│  │  • DDoS Protection                                        │  │
│  │  • Rate Limiting                                          │  │
│  │  • IP Whitelisting (Admin)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  Layer 2: Transport Security                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • SSL/TLS Encryption                                     │  │
│  │  • HTTPS Only                                             │  │
│  │  • Secure Headers (HSTS, CSP, etc.)                       │  │
│  │  • Certificate Management                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  Layer 3: Application Security                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • JWT Authentication                                     │  │
│  │  • Role-Based Access Control (RBAC)                       │  │
│  │  • Input Validation                                       │  │
│  │  • XSS Protection                                         │  │
│  │  • CSRF Protection                                        │  │
│  │  • SQL Injection Prevention (PDO)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  Layer 4: Data Security                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Password Hashing (bcrypt)                              │  │
│  │  • Encrypted Connections                                  │  │
│  │  • Secure Session Management                              │  │
│  │  • Data Encryption at Rest                                │  │
│  │  • Regular Backups                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  Layer 5: Container Security                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Non-root Containers                                    │  │
│  │  • Network Isolation                                      │  │
│  │  • Resource Limits                                        │  │
│  │  • Read-only Filesystems                                  │  │
│  │  • Security Scanning                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                             │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  cAdvisor    │───▶│  Prometheus  │───▶│   Grafana    │     │
│  │              │    │              │    │              │     │
│  │  Container   │    │   Metrics    │    │  Dashboard   │     │
│  │   Metrics    │    │  Collection  │    │ Visualization│     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                    │                    │            │
│         │                    │                    │            │
│  ┌──────▼────────────────────▼────────────────────▼──────┐     │
│  │                                                        │     │
│  │              Application Containers                    │     │
│  │                                                        │     │
│  │  • CPU Usage                                           │     │
│  │  • Memory Usage                                        │     │
│  │  • Disk I/O                                            │     │
│  │  • Network Traffic                                     │     │
│  │  • Request Rate                                        │     │
│  │  • Response Time                                       │     │
│  │  • Error Rate                                          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  Alerts:                                                        │
│  • High CPU/Memory usage                                        │
│  • Container down                                               │
│  • Disk space low                                               │
│  • High error rate                                              │
│  • Slow response time                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19.0.0 | UI Framework |
| | Vite 6.0.7 | Build Tool |
| | Tailwind CSS 3.4.17 | Styling |
| | React Router 7.9.4 | Routing |
| | Motion 11.15.0 | Animations |
| **Backend** | PHP 8.2-FPM | Server Runtime |
| | Nginx | Web Server |
| | JWT | Authentication |
| | PDO | Database Layer |
| | TCPDF | PDF Generation |
| **Database** | MySQL 8.0 | Data Storage |
| **Container** | Docker 20.10+ | Containerization |
| | Docker Compose 2.0+ | Orchestration |
| **Proxy** | Nginx | Reverse Proxy |
| **Monitoring** | Prometheus | Metrics |
| | Grafana | Visualization |
| | cAdvisor | Container Metrics |
| **Process Mgmt** | Supervisor | Process Manager |

## Performance Characteristics

- **Response Time**: < 200ms (average)
- **Throughput**: 1000+ requests/second
- **Availability**: 99.9% uptime
- **Scalability**: Horizontal scaling supported
- **Database**: Optimized with indexes and query caching
- **Caching**: OPcache, Nginx caching
- **Compression**: Gzip enabled
- **CDN Ready**: Static assets can be served via CDN
