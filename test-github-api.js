#!/usr/bin/env node

// Simple test script to verify GitHub API integration
// Run with: node test-github-api.js

const fetch = require('node-fetch');

async function testGitHubAPI() {
  console.log('🧪 Testing GitHub API integration...\n');

  const token = process.env.GITHUB_TOKEN; // Use GITHUB_TOKEN for this script
  
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  try {
    // Test 1: Fetch a popular repository
    console.log('📦 Test 1: Fetching repository info...');
    const repoResponse = await fetch('https://api.github.com/repos/facebook/react', { headers });
    
    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status} - ${repoResponse.statusText}`);
    }
    
    const repoData = await repoResponse.json();
    console.log(`✅ Repository: ${repoData.full_name}`);
    console.log(`   Stars: ${repoData.stargazers_count.toLocaleString()}`);
    console.log(`   Language: ${repoData.language}`);

    // Test 2: Fetch pull requests
    console.log('\n🔄 Test 2: Fetching pull requests...');
    const prResponse = await fetch('https://api.github.com/repos/facebook/react/pulls?state=open&per_page=5', { headers });
    
    if (!prResponse.ok) {
      throw new Error(`GitHub API error: ${prResponse.status} - ${prResponse.statusText}`);
    }
    
    const prData = await prResponse.json();
    console.log(`✅ Found ${prData.length} open pull requests:`);
    
    prData.forEach((pr, index) => {
      console.log(`   ${index + 1}. #${pr.number}: ${pr.title.substring(0, 60)}...`);
      console.log(`      Author: ${pr.user.login}, Comments: ${pr.comments}`);
    });

    // Test 3: Check rate limits
    console.log('\n⏱️  Test 3: Checking rate limits...');
    const rateLimitResponse = await fetch('https://api.github.com/rate_limit', { headers });
    
    if (rateLimitResponse.ok) {
      const rateLimitData = await rateLimitResponse.json();
      const core = rateLimitData.resources.core;
      console.log(`✅ Rate limit: ${core.remaining}/${core.limit} remaining`);
      console.log(`   Resets at: ${new Date(core.reset * 1000).toLocaleString()}`);
    }

    console.log('\n🎉 All tests passed! GitHub API integration is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n💡 To fix this:');
      console.log('1. Create a GitHub Personal Access Token at https://github.com/settings/tokens');
      console.log('2. Select the "public_repo" scope');
      console.log('3. Run this script with: GITHUB_TOKEN=your_token node test-github-api.js');
    }
    
    process.exit(1);
  }
}

testGitHubAPI();