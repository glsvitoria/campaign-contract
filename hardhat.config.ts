import hardhatToolboxMochaEthersPlugin from '@nomicfoundation/hardhat-toolbox-mocha-ethers'
import { defineConfig } from 'hardhat/config'
import 'dotenv/config'

export default defineConfig({
	plugins: [hardhatToolboxMochaEthersPlugin],
	paths: {
		sources: './contracts',
	},
	solidity: {
		profiles: {
			default: {
				version: '0.8.28',
			},
			production: {
				version: '0.8.28',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		},
	},
	networks: {
		hardhatMainnet: {
			type: 'edr-simulated',
			chainType: 'l1',
		},
		hardhatOp: {
			type: 'edr-simulated',
			chainType: 'op',
		},
		sepolia: {
			type: 'http',
			chainType: 'l1',
			url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts: {
				mnemonic: process.env.MNEMONIC!,
			},
		},
	},
})
