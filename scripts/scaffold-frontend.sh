#!/bin/bash

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo "Installing Angular CLI globally..."
    npm install -g @angular/cli
fi

# Create new Angular project
echo "Creating new Angular project..."
ng new frontend --directory frontend --routing --style scss --skip-git --skip-tests

# Navigate to frontend directory
cd frontend

# Install additional dependencies
echo "Installing additional dependencies..."
npm install @angular/material @ngrx/store @ngrx/effects @ngrx/entity

# Generate core modules and components
echo "Generating core modules and components..."
ng generate module core
ng generate module shared
ng generate module features/auth --routing
ng generate module features/products --routing

# Create environment files
echo "Creating environment files..."
mkdir -p src/environments
touch src/environments/environment.ts
touch src/environments/environment.prod.ts

echo "Frontend scaffold complete!"