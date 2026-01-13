# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
OpenDienstenNL is a Jekyll-based static website that showcases open source SaaS services. It's designed to run on GitHub Pages and presents a curated directory of privacy-friendly alternatives to mainstream services.

## Development Commands

### Local Development
```bash
# Install Jekyll dependencies (first time setup)
bundle install

# Run local development server
bundle exec jekyll serve

# Build the site locally
bundle exec jekyll build
```

### Deployment
- Push changes to GitHub main branch
- GitHub Pages automatically builds and deploys the site

## Architecture & Key Components

### Data Structure
All service data is stored in `_data/diensten.yml`. Each service entry contains:
- `naam`: Service name
- `software`: Underlying software
- `aanbieder`: Service provider
- `beschrijving`: Description
- `categorie`: Category (e.g., video, document, chat)
- `url`: Service URL
- `favicon`: Service icon URL
- `eu_hosting`: Boolean for EU hosting status
- `status`: Service status (live/disabled)

### Key Files
- `_data/diensten.yml`: Main service database
- `index.md`: Homepage content with Liquid templating
- `_layouts/default.html`: Main layout template
- `styles.css`: All styling (no CSS preprocessor)
- `api.json`: JSON API endpoint for programmatic access

### Frontend Architecture
- **Sidebar Navigation**: Fixed sidebar with category filters
- **Service Cards**: Grid layout with hover effects
- **Filtering**: Client-side JavaScript filtering by category
- **Responsive Design**: Mobile-friendly CSS

### Adding/Modifying Services
1. Edit `_data/diensten.yml`
2. Ensure all required fields are present
3. Test locally with `bundle exec jekyll serve`
4. Commit and push to deploy

### Common Tasks
- **Add new service**: Add entry to `_data/diensten.yml`
- **Add new category**: Add to diensten.yml entries and update category list in `index.md`
- **Update styling**: Modify `styles.css`
- **Change layout**: Edit `_layouts/default.html` or `index.md`

## Important Notes
- No build tools (npm, webpack) - pure Jekyll workflow
- No formal testing framework
- GitHub Pages handles all deployment automatically
- All data changes should be made in `_data/diensten.yml`
- The site uses vanilla JavaScript for interactivity (no frameworks)