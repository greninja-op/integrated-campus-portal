# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secret (minimum 32 characters)
- [ ] Review and update database credentials
- [ ] Set `APP_ENV=production` in `.env`
- [ ] Remove or secure database port exposure (3306)
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Review nginx security headers
- [ ] Disable PHP error display
- [ ] Enable OPcache
- [ ] Set secure session cookies

### Configuration
- [ ] Update `VITE_API_URL` with production domain
- [ ] Configure CORS settings in backend
- [ ] Set proper file upload limits
- [ ] Configure email settings (if applicable)
- [ ] Set timezone in PHP and MySQL
- [ ] Configure log rotation
- [ ] Set resource limits in docker-compose
- [ ] Review nginx worker processes
- [ ] Configure MySQL buffer pool size
- [ ] Set up database connection pooling

### Infrastructure
- [ ] Provision server with adequate resources (4GB+ RAM)
- [ ] Install Docker and Docker Compose
- [ ] Set up domain and DNS records
- [ ] Configure reverse proxy (if using external)
- [ ] Set up CDN (optional)
- [ ] Configure load balancer (if scaling)
- [ ] Set up monitoring tools
- [ ] Configure log aggregation
- [ ] Set up alerting system
- [ ] Plan backup strategy

## Deployment

### Initial Setup
- [ ] Clone repository to server
- [ ] Copy and configure `.env` file
- [ ] Review docker-compose.yml settings
- [ ] Build Docker images
- [ ] Initialize database schema
- [ ] Seed initial data (if needed)
- [ ] Test database connectivity
- [ ] Verify file permissions
- [ ] Test backend API endpoints
- [ ] Test frontend access

### SSL/TLS Setup
- [ ] Generate or obtain SSL certificates
- [ ] Place certificates in `ssl/` directory
- [ ] Update nginx configuration for HTTPS
- [ ] Test HTTPS access
- [ ] Configure HTTP to HTTPS redirect
- [ ] Verify SSL certificate validity
- [ ] Set up auto-renewal (Let's Encrypt)

### Container Deployment
- [ ] Start containers: `docker-compose up -d`
- [ ] Verify all containers are running
- [ ] Check container health status
- [ ] Review container logs
- [ ] Test inter-container networking
- [ ] Verify volume mounts
- [ ] Test database migrations
- [ ] Verify file uploads work
- [ ] Test API authentication
- [ ] Test frontend routing

## Post-Deployment

### Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test student features
- [ ] Test teacher features
- [ ] Test admin features
- [ ] Test file uploads
- [ ] Test PDF generation
- [ ] Test payment processing
- [ ] Test attendance marking
- [ ] Test marks entry
- [ ] Load test with expected traffic
- [ ] Test error handling
- [ ] Test session management
- [ ] Verify CORS settings
- [ ] Test mobile responsiveness

### Monitoring
- [ ] Set up health check endpoints
- [ ] Configure uptime monitoring
- [ ] Set up log monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure resource alerts
- [ ] Set up database monitoring
- [ ] Monitor disk usage
- [ ] Monitor memory usage
- [ ] Monitor CPU usage
- [ ] Set up backup monitoring

### Backup
- [ ] Test database backup script
- [ ] Test file backup script
- [ ] Test restore procedure
- [ ] Schedule automated backups
- [ ] Configure backup retention
- [ ] Set up off-site backup storage
- [ ] Document backup procedures
- [ ] Test disaster recovery plan

### Documentation
- [ ] Document deployment process
- [ ] Document environment variables
- [ ] Document API endpoints
- [ ] Document backup procedures
- [ ] Document rollback procedures
- [ ] Document troubleshooting steps
- [ ] Create runbook for common issues
- [ ] Document monitoring setup
- [ ] Create incident response plan

## Maintenance

### Regular Tasks
- [ ] Review logs weekly
- [ ] Check disk space weekly
- [ ] Review security updates weekly
- [ ] Update Docker images monthly
- [ ] Review backup integrity monthly
- [ ] Test restore procedure monthly
- [ ] Review access logs monthly
- [ ] Update dependencies quarterly
- [ ] Review security policies quarterly
- [ ] Conduct security audit annually

### Performance
- [ ] Monitor response times
- [ ] Optimize slow queries
- [ ] Review and optimize indexes
- [ ] Monitor cache hit rates
- [ ] Review and optimize images
- [ ] Implement CDN if needed
- [ ] Review database query performance
- [ ] Optimize frontend bundle size
- [ ] Review and optimize API calls
- [ ] Monitor and optimize memory usage

### Security
- [ ] Review access logs for suspicious activity
- [ ] Update security patches
- [ ] Review user permissions
- [ ] Rotate credentials periodically
- [ ] Review firewall rules
- [ ] Scan for vulnerabilities
- [ ] Review SSL certificate expiry
- [ ] Update security headers
- [ ] Review CORS policies
- [ ] Conduct penetration testing

## Rollback Plan

### Preparation
- [ ] Document current version
- [ ] Create database backup
- [ ] Create file backup
- [ ] Tag Docker images
- [ ] Document configuration changes

### Rollback Steps
1. Stop current containers
2. Restore database from backup
3. Restore files from backup
4. Deploy previous Docker images
5. Verify functionality
6. Monitor for issues

### Post-Rollback
- [ ] Investigate deployment failure
- [ ] Document issues encountered
- [ ] Update deployment procedures
- [ ] Plan fixes for next deployment

## Emergency Contacts

- DevOps Lead: _________________
- Database Admin: _________________
- Security Team: _________________
- On-Call Engineer: _________________

## Useful Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Backup database
./scripts/backup.sh

# Health check
./scripts/health-check.sh

# Stop all
docker-compose down

# Emergency stop
docker-compose kill
```

## Notes

Date Deployed: _________________
Deployed By: _________________
Version: _________________
Issues Encountered: _________________
