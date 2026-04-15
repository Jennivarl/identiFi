import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy MockUSDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddr = await mockUsdc.getAddress();
  console.log("MockUSDC deployed to:", mockUsdcAddr);

  // 2. Deploy MockKycSBT
  const MockKyc = await hre.ethers.getContractFactory("MockKycSBT");
  const mockKyc = await MockKyc.deploy();
  await mockKyc.waitForDeployment();
  const mockKycAddr = await mockKyc.getAddress();
  console.log("MockKycSBT deployed to:", mockKycAddr);

  // 3. Deploy IdentiFi pointing at MockKycSBT + MockUSDC
  const IdentiFi = await hre.ethers.getContractFactory("IdentiFi");
  const identifi = await IdentiFi.deploy(mockKycAddr, mockUsdcAddr);
  await identifi.waitForDeployment();
  const identifiAddr = await identifi.getAddress();
  console.log("IdentiFi deployed to:", identifiAddr);

  // 4. Transfer USDC minting rights to IdentiFi
  const tx0 = await mockUsdc.setMinter(identifiAddr);
  await tx0.wait();
  console.log("MockUSDC minter set to IdentiFi");

  // 5. Set demo HSK price: $100/HSK (10000 cents) — makes demo borrows work with tiny HSK amounts
  const txPrice = await identifi.updateHSKPrice(10000);
  await txPrice.wait();
  console.log("HSK price set to $100 (demo mode)");

  // 6. Seed liquidity pool display value (1,000,000 mock USD — 6 decimals)
  const tx1 = await identifi.addLiquidity(1_000_000n * 1_000_000n);
  await tx1.wait();
  console.log("Liquidity pool seeded: 1,000,000 USD");

  // 4. Set demo KYC levels
  //    WALLET_A = ADVANCED (level 2), WALLET_B stays NONE (level 0)
  if (process.env.DEMO_WALLET_A) {
    // KycLevel enum: NONE=0, BASIC=1, ADVANCED=2, PREMIUM=3, ULTIMATE=4
    const tx2 = await mockKyc.setKycLevel(process.env.DEMO_WALLET_A, 2);
    await tx2.wait();
    console.log("DEMO_WALLET_A set to ADVANCED:", process.env.DEMO_WALLET_A);
  }

  if (process.env.DEMO_WALLET_B) {
    const tx3 = await mockKyc.setKycLevel(process.env.DEMO_WALLET_B, 4);
    await tx3.wait();
    console.log("DEMO_WALLET_B set to ULTIMATE:", process.env.DEMO_WALLET_B);
  }

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("MockUSDC:  ", mockUsdcAddr);
  console.log("MockKycSBT:", mockKycAddr);
  console.log("IdentiFi:  ", identifiAddr);
  console.log("\nAdd these to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_IDENTIFI_ADDRESS=${identifiAddr}`);
  console.log(`NEXT_PUBLIC_KYC_ADDRESS=${mockKycAddr}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${mockUsdcAddr}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=133`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
