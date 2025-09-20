#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const blockchainArtifactsPath = path.join(__dirname, '../../blockchain/artifacts/contracts');
const wagmiGeneratedPath = path.join(__dirname, '../src/lib/wagmi-generated.ts');

function addBytecodeToWagmiGenerated() {
  try {
    // Read the wagmi-generated file
    let wagmiContent = fs.readFileSync(wagmiGeneratedPath, 'utf8');
    
    // Find all contract directories
    const contractDirs = fs.readdirSync(blockchainArtifactsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const contractDir of contractDirs) {
      const contractPath = path.join(blockchainArtifactsPath, contractDir);
      const jsonFiles = fs.readdirSync(contractPath)
        .filter(file => file.endsWith('.json') && !file.includes('.dbg.json'));

      for (const jsonFile of jsonFiles) {
        const contractName = jsonFile.replace('.json', '');
        const contractJsonPath = path.join(contractPath, jsonFile);
        
        try {
          const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
          
          if (contractJson.bytecode) {
            const bytecodeVarName = `${contractName.toLowerCase()}Bytecode`;
            const bytecodeExport = `\nexport const ${bytecodeVarName} = "${contractJson.bytecode}" as const`;
            
            // Check if bytecode already exists
            if (!wagmiContent.includes(bytecodeVarName)) {
              // Find the position after the ABI export
              const abiExportPattern = new RegExp(`export const ${contractName.toLowerCase()}Abi = \\[[\\s\\S]*?\\] as const`);
              const match = wagmiContent.match(abiExportPattern);
              
              if (match) {
                const insertPosition = match.index + match[0].length;
                wagmiContent = wagmiContent.slice(0, insertPosition) + bytecodeExport + wagmiContent.slice(insertPosition);
                console.log(`✅ Added bytecode for ${contractName}`);
              }
            } else {
              console.log(`ℹ️  Bytecode for ${contractName} already exists`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing ${contractName}:`, error.message);
        }
      }
    }

    // Write the updated content back
    fs.writeFileSync(wagmiGeneratedPath, wagmiContent);
    console.log('✅ Bytecode addition completed');

  } catch (error) {
    console.error('❌ Error adding bytecode:', error.message);
    process.exit(1);
  }
}

addBytecodeToWagmiGenerated();