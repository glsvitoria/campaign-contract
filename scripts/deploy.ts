import { network } from 'hardhat'

const { ethers } = await network.connect()

async function main() {
	const CampaignFactory = await ethers.getContractFactory('CampaignFactory')

	const campaignFactory = await CampaignFactory.deploy()

	await campaignFactory.waitForDeployment()

	console.log(
		'CampaignFactory deployed at:',
		await campaignFactory.getAddress(),
	)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
