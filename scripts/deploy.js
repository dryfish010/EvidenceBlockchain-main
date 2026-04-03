async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with account:", deployer.address);

    // 1️⃣ 部署 EvidenceToken
    const Token = await ethers.getContractFactory("EvidenceToken");
    const token = await Token.deploy();
    await token.deployed();
    console.log("EvidenceToken deployed to:", token.address);

    // 2️⃣ 部署 EvidenceSystem
    const System = await ethers.getContractFactory("EvidenceSystem");
    const system = await System.deploy(token.address);
    await system.deployed();
    console.log("EvidenceSystem deployed to:", system.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});