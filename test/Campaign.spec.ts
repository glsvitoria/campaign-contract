import { expect } from 'chai'
import { network } from 'hardhat'
import type { CampaignFactory } from '../types/ethers-contracts/CampaignFactory'
import type { Signer } from 'ethers'
import type { Campaign } from '../types/ethers-contracts/Campaign'

const { ethers } = await network.connect()

describe('Campaign Contract', function () {
	let campaignFactory: CampaignFactory
	let campaign: Campaign
	let accounts: Signer[]
	let snapshotId: string

	before(async () => {
		accounts = await ethers.getSigners()

		const Campaign = await ethers.getContractFactory('CampaignFactory')

		campaignFactory = await Campaign.connect(accounts[0]).deploy()

		await campaignFactory.waitForDeployment()

		await campaignFactory.createCampaign(100)

		const [campaignAddress] = await campaignFactory.getDeployedCampaigns()

		campaign = await ethers.getContractAt('Campaign', campaignAddress)

		snapshotId = await ethers.provider.send('evm_snapshot', [])
	})

	beforeEach(async () => {
		await ethers.provider.send('evm_revert', [snapshotId])

		snapshotId = await ethers.provider.send('evm_snapshot', [])
	})

	it('deploys a campaign factory', async () => {
		expect(await campaignFactory.getAddress()).to.not.equal(undefined)
	})

	it('deploys a campaign', async () => {
		expect(await campaign.getAddress()).to.not.equal(undefined)
	})
})
