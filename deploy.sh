#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting FarmFit - GrowthQuest deployment...${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}Git repository not initialized. Initializing...${NC}"
    git init
fi

# Create gh-pages branch if it doesn't exist
if ! git rev-parse --verify gh-pages >/dev/null 2>&1; then
    echo -e "${GREEN}Creating gh-pages branch...${NC}"
    git checkout --orphan gh-pages
    git rm -rf .
else
    echo -e "${GREEN}Switching to gh-pages branch...${NC}"
    git checkout gh-pages
fi

# Copy necessary files
echo -e "${GREEN}Copying files...${NC}"
cp -r web/* .
cp README.md .

# Create .nojekyll file to bypass Jekyll processing
touch .nojekyll

# Add all files
git add .

# Commit changes
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "Deploy to GitHub Pages"

# Push to gh-pages
echo -e "${GREEN}Pushing to GitHub Pages...${NC}"
git push origin gh-pages --force

# Switch back to main branch
git checkout main

echo -e "${GREEN}✨ Deployment complete!${NC}"
echo -e "${GREEN}Visit https://[your-github-username].github.io/farmfit-growthquest to view the demo${NC}"
