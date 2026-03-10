import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CampaignModule', (m) => {
	const campaignFactory = m.contract('CampaignFactory')

	return { campaignFactory }
})
