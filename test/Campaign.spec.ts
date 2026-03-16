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

		await campaignFactory.createCampaign(ethers.parseEther('1'))

		const [campaignAddress] = await campaignFactory.getDeployedCampaigns()

		campaign = await ethers.getContractAt('Campaign', campaignAddress)

		snapshotId = await ethers.provider.send('evm_snapshot', [])
	})

	beforeEach(async () => {
		await ethers.provider.send('evm_revert', [snapshotId])

		snapshotId = await ethers.provider.send('evm_snapshot', [])
	})

	it('deploys a campaign factory', async () => {
		expect(await campaignFactory.getAddress()).to.be.properAddress
	})

	it('deploys a campaign', async () => {
		expect(await campaign.getAddress()).to.be.properAddress
	})

	it('marks caller as the campaign manager', async () => {
		const manager = await campaign.manager()

		expect(manager).to.equal(await accounts[0].getAddress())
	})

	it('allows people to contribute and marks them as approvers', async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		const isApprover = await campaign.approvers(await accounts[1].getAddress())

		expect(isApprover).to.be.true
	})

	it('requires a minimum contribution', async () => {
		await expect(
			campaign
				.connect(accounts[1])
				.contribute({ value: ethers.parseEther('0.1') }),
		).to.be.revertedWith('Minimum contribution not met')
	})

	it("don't increase approvers count if the same address contributes multiple times", async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		const approversCount = await campaign.approversCount()

		expect(approversCount).to.equal(1)
	})

	it('allows a manager to make a payment request', async () => {
		await campaign
			.connect(accounts[0])
			.createRequest(
				'Buy materials',
				ethers.parseEther('1'),
				await accounts[2].getAddress(),
			)

		const request = await campaign.requests(0)

		expect(request.description).to.equal('Buy materials')
		expect(request.value).to.equal(ethers.parseEther('1'))
		expect(request.recipient).to.equal(await accounts[2].getAddress())
		expect(request.complete).to.be.false
		expect(request.approvalCount).to.equal(0)
	})

	it('allows a manager to make a payment request only if they are the manager', async () => {
		await expect(
			campaign
				.connect(accounts[1])
				.createRequest(
					'Buy materials',
					ethers.parseEther('1'),
					await accounts[2].getAddress(),
				),
		).to.be.revertedWith('Only manager can call this')
	})

	it('allows contributors to approve requests', async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		await campaign
			.connect(accounts[0])
			.createRequest(
				'Buy materials',
				ethers.parseEther('1'),
				await accounts[2].getAddress(),
			)

		await campaign.connect(accounts[1]).approveRequest(0)

		const request = await campaign.requests(0)

		expect(request.approvalCount).to.equal(1)
	})

	it('allow only one approval per contributor', async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		await campaign
			.connect(accounts[0])
			.createRequest(
				'Buy materials',
				ethers.parseEther('1'),
				await accounts[2].getAddress(),
			)

		await campaign.connect(accounts[1]).approveRequest(0)

		await expect(
			campaign.connect(accounts[1]).approveRequest(0),
		).to.be.revertedWith('Already approved')
	})

	it('allow only contributors to approve requests', async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		await campaign
			.connect(accounts[0])
			.createRequest(
				'Buy materials',
				ethers.parseEther('1'),
				await accounts[2].getAddress(),
			)

		await expect(
			campaign.connect(accounts[2]).approveRequest(0),
		).to.be.revertedWith('Only contributors can approve')
	})

	it('allow only manager to finalize requests', async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		await campaign
			.connect(accounts[0])
			.createRequest(
				'Buy materials',
				ethers.parseEther('0.5'),
				await accounts[2].getAddress(),
			)

		await campaign.connect(accounts[1]).approveRequest(0)

		await expect(
			campaign.connect(accounts[1]).finalizeRequest(0),
		).to.be.revertedWith('Only manager can call this')
	})

	it('processes requests', async () => {
		await campaign
			.connect(accounts[1])
			.contribute({ value: ethers.parseEther('1') })

		await campaign
			.connect(accounts[0])
			.createRequest(
				'Buy materials',
				ethers.parseEther('0.5'),
				await accounts[2].getAddress(),
			)

		await campaign.connect(accounts[1]).approveRequest(0)

		const initialBalance = await ethers.provider.getBalance(
			await accounts[2].getAddress(),
		)

		await campaign.connect(accounts[0]).finalizeRequest(0)

		const finalBalance = await ethers.provider.getBalance(
			await accounts[2].getAddress(),
		)

		expect(finalBalance - initialBalance).to.equal(ethers.parseEther('0.5'))
	})
})
