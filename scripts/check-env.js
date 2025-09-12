#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * 
 * This script checks for required and optional environment variables
 * and provides guidance on setting them up.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Required environment variables
const REQUIRED_VARS = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase project URL',
    example: 'https://your-project-id.supabase.co',
    source: 'Supabase Dashboard -> Settings -> API -> Project URL'
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key (server-side only)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    source: 'Supabase Dashboard -> Settings -> API -> service_role key',
    sensitive: true
  },
  'NEXT_PUBLIC_SITE_URL': {
    description: 'Your application URL',
    example: 'https://your-domain.com',
    source: 'Your domain or Vercel deployment URL'
  }
};

// Optional but recommended environment variables
const OPTIONAL_VARS = {
  'SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key (client-side)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    source: 'Supabase Dashboard -> Settings -> API -> anon public key',
    category: 'Authentication'
  },
  'SENTRY_DSN': {
    description: 'Sentry error tracking DSN',
    example: 'https://xxx@xxx.ingest.sentry.io/xxx',
    source: 'Sentry Dashboard -> Project -> Settings -> Client Keys',
    category: 'Monitoring'
  },
  'SMTP_HOST': {
    description: 'SMTP server for email notifications',
    example: 'smtp.gmail.com',
    source: 'Your email provider settings',
    category: 'Email'
  },
  'SMTP_USER': {
    description: 'SMTP username',
    example: 'your-email@gmail.com',
    source: 'Your email provider settings',
    category: 'Email'
  },
  'SMTP_PASS': {
    description: 'SMTP password or app password',
    example: 'your-app-password',
    source: 'Your email provider settings (use app password for Gmail)',
    category: 'Email',
    sensitive: true
  },
  'TWILIO_ACCOUNT_SID': {
    description: 'Twilio Account SID for SMS notifications',
    example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    source: 'Twilio Console -> Account -> Account Info',
    category: 'SMS'
  },
  'TWILIO_AUTH_TOKEN': {
    description: 'Twilio Auth Token',
    example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    source: 'Twilio Console -> Account -> Account Info',
    category: 'SMS',
    sensitive: true
  },
  'STRIPE_SECRET_KEY': {
    description: 'Stripe secret key for payments',
    example: 'sk_test_xxxxxxxxxxxxxxxxxxxxx',
    source: 'Stripe Dashboard -> Developers -> API keys',
    category: 'Payments',
    sensitive: true
  },
  'AWS_ACCESS_KEY_ID': {
    description: 'AWS access key for S3 file storage',
    example: 'AKIAIOSFODNN7EXAMPLE',
    source: 'AWS Console -> IAM -> Users -> Security credentials',
    category: 'File Storage',
    sensitive: true
  },
  'AWS_SECRET_ACCESS_KEY': {
    description: 'AWS secret access key',
    example: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    source: 'AWS Console -> IAM -> Users -> Security credentials',
    category: 'File Storage',
    sensitive: true
  },
  'REDIS_URL': {
    description: 'Redis URL for caching',
    example: 'redis://localhost:6379',
    source: 'Your Redis provider or local installation',
    category: 'Caching'
  }
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBold(message, color = 'white') {
  console.log(`${colors.bold}${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentVariables() {
  logBold('🔍 Port San Antonio Staff Portal - Environment Check', 'cyan');
  console.log();

  // Check if .env.local or .env files exist
  const envFiles = ['.env.local', '.env', '.env.production'];
  const existingEnvFiles = envFiles.filter(file => fs.existsSync(path.join(process.cwd(), file)));
  
  if (existingEnvFiles.length > 0) {
    log(`📁 Found environment files: ${existingEnvFiles.join(', ')}`, 'green');
  } else {
    log('⚠️  No environment files found. Consider creating .env.local for development.', 'yellow');
  }
  
  console.log();

  // Check required variables
  logBold('✅ REQUIRED ENVIRONMENT VARIABLES', 'green');
  console.log();

  const missingRequired = [];
  let hasAllRequired = true;

  Object.entries(REQUIRED_VARS).forEach(([varName, config]) => {
    const value = process.env[varName];
    const isSet = value && value !== '';
    
    if (isSet) {
      const displayValue = config.sensitive ? '***' : value;
      log(`✓ ${varName}: ${displayValue}`, 'green');
    } else {
      log(`✗ ${varName}: NOT SET`, 'red');
      missingRequired.push({ varName, config });
      hasAllRequired = false;
    }
  });

  if (missingRequired.length > 0) {
    console.log();
    logBold('❌ MISSING REQUIRED VARIABLES', 'red');
    console.log();
    
    missingRequired.forEach(({ varName, config }) => {
      log(`${varName}:`, 'red');
      log(`  Description: ${config.description}`, 'white');
      log(`  Example: ${config.example}`, 'yellow');
      log(`  Source: ${config.source}`, 'blue');
      console.log();
    });

    logBold('🛠️  HOW TO SET MISSING VARIABLES:', 'yellow');
    console.log();
    
    log('For local development (.env.local):', 'cyan');
    missingRequired.forEach(({ varName, config }) => {
      log(`echo "${varName}=${config.example}" >> .env.local`, 'white');
    });
    
    console.log();
    log('For Vercel deployment:', 'cyan');
    missingRequired.forEach(({ varName }) => {
      log(`vercel env add ${varName}`, 'white');
    });
  }

  console.log();
  
  // Check optional variables
  logBold('🔧 OPTIONAL ENVIRONMENT VARIABLES', 'blue');
  console.log();

  const categorizedOptional = {};
  Object.entries(OPTIONAL_VARS).forEach(([varName, config]) => {
    const category = config.category || 'Other';
    if (!categorizedOptional[category]) {
      categorizedOptional[category] = [];
    }
    categorizedOptional[category].push({ varName, config });
  });

  Object.entries(categorizedOptional).forEach(([category, vars]) => {
    logBold(`${category}:`, 'magenta');
    vars.forEach(({ varName, config }) => {
      const value = process.env[varName];
      const isSet = value && value !== '';
      
      if (isSet) {
        const displayValue = config.sensitive ? '***' : value;
        log(`  ✓ ${varName}: ${displayValue}`, 'green');
      } else {
        log(`  - ${varName}: not set`, 'yellow');
        log(`    ${config.description}`, 'white');
      }
    });
    console.log();
  });

  // Summary and recommendations
  console.log();
  logBold('📊 SUMMARY', 'cyan');
  console.log();

  if (hasAllRequired) {
    log('✅ All required environment variables are set!', 'green');
  } else {
    log(`❌ ${missingRequired.length} required environment variables are missing.`, 'red');
  }

  const setOptional = Object.keys(OPTIONAL_VARS).filter(varName => 
    process.env[varName] && process.env[varName] !== ''
  ).length;
  
  log(`🔧 ${setOptional}/${Object.keys(OPTIONAL_VARS).length} optional variables are configured.`, 'blue');

  console.log();
  logBold('🚀 NEXT STEPS', 'green');
  console.log();

  if (!hasAllRequired) {
    log('1. Set all required environment variables', 'white');
    log('2. Restart your development server', 'white');
    log('3. Run this script again to verify', 'white');
  } else {
    log('1. ✅ Required variables are set', 'green');
    log('2. Consider setting optional variables for enhanced features', 'white');
    log('3. Run database migrations if needed', 'white');
    log('4. Test your application', 'white');
  }

  console.log();
  logBold('📚 USEFUL COMMANDS', 'cyan');
  console.log();
  
  log('Create .env.local from example:', 'white');
  log('cp .env.example .env.local', 'yellow');
  console.log();
  
  log('Verify database connection:', 'white');
  log('node scripts/verify-setup.js', 'yellow');
  console.log();
  
  log('Import initial data:', 'white');
  log('node scripts/import-menu.js', 'yellow');
  console.log();
  
  log('Check application health:', 'white');
  log('curl http://localhost:3000/api/health', 'yellow');

  console.log();
  
  // Exit with appropriate code
  process.exit(hasAllRequired ? 0 : 1);
}

// Run the check
try {
  // Load environment variables from .env files
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config({ path: '.env' });
  
  checkEnvironmentVariables();
} catch (error) {
  // If dotenv is not available, just run with existing process.env
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('dotenv')) {
    log('⚠️  dotenv not found, checking environment variables from system only...', 'yellow');
    checkEnvironmentVariables();
  } else {
    log('❌ Error running environment check:', 'red');
    console.error(error);
    process.exit(1);
  }
}
