# Setup GeoJSON Routes - Best Practices Guide

## 🚀 Quick Start

### 1. Konfigurasi Environment
Tambahkan ke file `.env`:
```bash
# OpenRouteService API (Recommended)
OPENROUTESERVICE_API_KEY=your_api_key_here
OPENROUTESERVICE_BASE_URL=https://api.openrouteservice.org
```

### 2. Fresh Install
```bash
# Clone & Install
composer install
npm install && npm run build

# Setup database dengan GeoJSON routes
php artisan migrate:fresh --seed

# Verify configuration
php artisan fo:config-check
```

## 🔑 API Key Setup

### OpenRouteService (Recommended - Free)
1. Daftar di: https://openrouteservice.org/dev/#/signup
2. Verifikasi email
3. Buat API key di dashboard
4. Copy key ke `.env`
5. Quota: **2000 requests/day, 40 requests/minute**

### Alternative Services (Future)
- **Mapbox**: 100,000 requests/month free
- **Google Maps**: $200 credit/month
- **GraphHopper**: 500 requests/day free

## ⚙️ Configuration Validation

### Check Configuration
```bash
php artisan fo:config-check
```

Output yang baik:
```
✅ Configuration: All settings properly configured  
✅ Service: OpenRouteService properly configured
✅ Connectivity: OpenRouteService API accessible
```

### Troubleshooting Configuration
```bash
# Clear config cache
php artisan config:clear

# Check environment
php artisan env

# Test database connection
php artisan migrate:status
```

## 🔄 Route Generation Workflows

### Manual Generation
```bash
# Generate semua routes
php artisan fo:generate-routes

# Generate area tertentu  
php artisan fo:generate-routes --area=ungaran

# Check status
php artisan fo:config-check
```

### Automatic Generation (Fresh Install)
Routes otomatis di-generate saat:
- `php artisan migrate:fresh --seed`
- `GenerateGeoJsonRoutesSeeder` dijalankan

### Via Admin Interface
1. Login sebagai admin
2. Buka "FO Management" 
3. Klik "Generate Semua Jalur"
4. Tunggu proses selesai

## 📊 Monitoring & Logging

### Log Locations
```
storage/logs/laravel.log
```

### Log Levels
```bash
# Debug (semua logs)
FO_ROUTE_LOG_LEVEL=debug

# Info (default)
FO_ROUTE_LOG_LEVEL=info  

# Warning & Error only
FO_ROUTE_LOG_LEVEL=warning
```

### Key Log Patterns
```
[INFO] Starting route generation for: Route Name
[INFO] Successfully generated route for: Route Name  
[WARNING] OpenRouteService API key not configured
[ERROR] Failed to generate route for: Route Name
```

## 🏗️ Development Best Practices

### Environment Setup
```bash
# Development
APP_ENV=local
APP_DEBUG=true
FO_ROUTE_LOG_LEVEL=debug

# Staging  
APP_ENV=staging
APP_DEBUG=false
FO_ROUTE_LOG_LEVEL=info

# Production
APP_ENV=production  
APP_DEBUG=false
FO_ROUTE_LOG_LEVEL=warning
```

### Testing Strategy
```bash
# Test dengan satu route
php artisan fo:generate-routes --area=ungaran

# Test fresh install
php artisan migrate:fresh --seed

# Test configuration
php artisan fo:config-check

# Test API connectivity
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.openrouteservice.org/v2/directions/driving-car"
```

### Performance Optimization
```bash
# Cache configurations
php artisan config:cache

# Optimize autoloader  
composer dump-autoload --optimize

# Cache routes & views
php artisan route:cache
php artisan view:cache
```

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### ❌ "OpenRouteService API key not configured"
```bash
# Check .env file
cat .env | grep OPENROUTESERVICE

# Clear config cache
php artisan config:clear

# Restart server
```

#### ❌ "Failed to generate route"
```bash
# Check logs
tail -f storage/logs/laravel.log

# Verify coordinates
php artisan fo:generate-routes --area=ungaran

# Check database
php artisan tinker
>>> App\Models\FoPoint::where('route_name', 'Route Name')->count()
```

#### ❌ Routes tidak muncul di frontend
```bash
# Clear browser cache
# Check browser console for errors
# Verify data structure:

php artisan tinker
>>> App\Models\FoRoute::first()->hasValidGeoJSON()
>>> App\Models\FoRoute::first()->getGeoJSONCoordinates()
```

#### ❌ API Rate Limited
```bash
# Check quota usage di OpenRouteService dashboard
# Reduce batch size:
FO_ROUTE_BATCH_SIZE=10
FO_ROUTE_REQUEST_DELAY=500

# Or upgrade to premium plan
```

### Database Issues
```bash
# Reset database
php artisan migrate:fresh --seed

# Check migrations
php artisan migrate:status

# Verify seeder
php artisan db:seed --class=GenerateGeoJsonRoutesSeeder
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] `.env` configured with API key
- [ ] Database migrated
- [ ] Routes cached: `php artisan route:cache`
- [ ] Config cached: `php artisan config:cache`  
- [ ] Views cached: `php artisan view:cache`
- [ ] Autoloader optimized: `composer dump-autoload --optimize`

### Production Commands
```bash
# Deploy with routes
php artisan migrate --force
php artisan fo:generate-routes

# Or fresh deploy
php artisan migrate:fresh --seed --force
```

### Monitoring
```bash
# Check route generation status
php artisan fo:config-check

# Monitor logs
tail -f storage/logs/laravel.log | grep "route generation"

# Database stats  
php artisan tinker
>>> App\Models\FoRoute::where('routing_service', 'openrouteservice')->count()
```

## 📈 Performance Metrics

### Expected Performance
- **Route Generation**: ~500ms per route dengan API
- **Fallback Generation**: ~50ms per route tanpa API  
- **Memory Usage**: ~10MB per 100 routes
- **API Quota**: 2000 routes/day (free tier)

### Optimization Tips
1. **Batch Processing**: Generate routes di background
2. **Caching**: Cache hasil API calls
3. **Rate Limiting**: Respect API limits
4. **Fallback**: Selalu siap dengan fallback system
5. **Monitoring**: Track API usage dan success rate

---

**Developed by**: Hassan  
**Last Updated**: September 2025  
**Version**: 1.0.0

