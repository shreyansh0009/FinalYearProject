const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentVerification", function () {
  let contract;
  let admin, issuer1, issuer2, student1;
  const testDocHash = "0x" + "a".repeat(64); // 32-byte hash
  const testDocHash2 = "0x" + "b".repeat(64);

  beforeEach(async function () {
    [admin, issuer1, issuer2, student1] = await ethers.getSigners();
    const DocumentVerification = await ethers.getContractFactory("DocumentVerification");
    contract = await DocumentVerification.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
    });
  });

  describe("Admin Transfer", function () {
    it("Should allow admin to transfer admin role", async function () {
      await expect(contract.transferAdmin(issuer1.address))
        .to.emit(contract, "AdminTransferred")
        .withArgs(admin.address, issuer1.address);
      expect(await contract.admin()).to.equal(issuer1.address);
    });

    it("Should reject transfer to zero address", async function () {
      await expect(
        contract.transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("New admin cannot be zero address");
    });

    it("Should reject transfer from non-admin", async function () {
      await expect(
        contract.connect(issuer1).transferAdmin(issuer2.address)
      ).to.be.revertedWith("Caller is not the admin");
    });

    it("Should reject transfer to same address", async function () {
      await expect(
        contract.transferAdmin(admin.address)
      ).to.be.revertedWith("New admin cannot be the same address");
    });
  });

  describe("Set Issuer", function () {
    it("Should allow admin to grant issuer role", async function () {
      await expect(contract.setIssuer(issuer1.address, true))
        .to.emit(contract, "IssuerToggled")
        .withArgs(issuer1.address, true);
      expect(await contract.isIssuer(issuer1.address)).to.equal(true);
    });

    it("Should allow admin to revoke issuer role", async function () {
      await contract.setIssuer(issuer1.address, true);
      await expect(contract.setIssuer(issuer1.address, false))
        .to.emit(contract, "IssuerToggled")
        .withArgs(issuer1.address, false);
      expect(await contract.isIssuer(issuer1.address)).to.equal(false);
    });

    it("Should reject setIssuer from non-admin", async function () {
      await expect(
        contract.connect(issuer1).setIssuer(issuer2.address, true)
      ).to.be.revertedWith("Caller is not the admin");
    });
  });

  describe("Issue Document (by issuer)", function () {
    beforeEach(async function () {
      await contract.setIssuer(issuer1.address, true);
    });

    it("Should allow issuer to issue a document", async function () {
      await expect(contract.connect(issuer1).issueDocument(testDocHash))
        .to.emit(contract, "DocumentIssued")
        .withArgs(testDocHash, issuer1.address);
      expect(await contract.documentIssuers(testDocHash)).to.equal(issuer1.address);
    });

    it("Should reject duplicate document hash", async function () {
      await contract.connect(issuer1).issueDocument(testDocHash);
      await expect(
        contract.connect(issuer1).issueDocument(testDocHash)
      ).to.be.revertedWith("Document hash already exists");
    });

    it("Should reject issuance from non-issuer", async function () {
      await expect(
        contract.connect(student1).issueDocument(testDocHash)
      ).to.be.revertedWith("Caller does not have issuer role");
    });
  });

  describe("Issue Document On Behalf (by admin)", function () {
    beforeEach(async function () {
      await contract.setIssuer(issuer1.address, true);
    });

    it("Should allow admin to issue on behalf of issuer", async function () {
      await expect(contract.issueDocumentOnBehalf(testDocHash, issuer1.address))
        .to.emit(contract, "DocumentIssued")
        .withArgs(testDocHash, issuer1.address);
      expect(await contract.documentIssuers(testDocHash)).to.equal(issuer1.address);
    });

    it("Should reject if target is not an issuer", async function () {
      await expect(
        contract.issueDocumentOnBehalf(testDocHash, student1.address)
      ).to.be.revertedWith("Target address is not an issuer");
    });

    it("Should reject if called by non-admin", async function () {
      await expect(
        contract.connect(issuer1).issueDocumentOnBehalf(testDocHash, issuer1.address)
      ).to.be.revertedWith("Caller is not the admin");
    });

    it("Should reject duplicate hash", async function () {
      await contract.issueDocumentOnBehalf(testDocHash, issuer1.address);
      await expect(
        contract.issueDocumentOnBehalf(testDocHash, issuer1.address)
      ).to.be.revertedWith("Document hash already exists");
    });
  });

  describe("Revoke Document", function () {
    beforeEach(async function () {
      await contract.setIssuer(issuer1.address, true);
      await contract.connect(issuer1).issueDocument(testDocHash);
    });

    it("Should allow admin to revoke a document", async function () {
      await expect(contract.revokeDocument(testDocHash))
        .to.emit(contract, "DocumentRevoked")
        .withArgs(testDocHash);
      expect(await contract.documentRevoked(testDocHash)).to.equal(true);
    });

    it("Should reject revocation of non-existent document", async function () {
      await expect(
        contract.revokeDocument(testDocHash2)
      ).to.be.revertedWith("Document does not exist");
    });

    it("Should reject duplicate revocation", async function () {
      await contract.revokeDocument(testDocHash);
      await expect(
        contract.revokeDocument(testDocHash)
      ).to.be.revertedWith("Document already revoked");
    });

    it("Should reject revocation from non-admin", async function () {
      await expect(
        contract.connect(issuer1).revokeDocument(testDocHash)
      ).to.be.revertedWith("Caller is not the admin");
    });
  });

  describe("Verify Document", function () {
    beforeEach(async function () {
      await contract.setIssuer(issuer1.address, true);
      await contract.connect(issuer1).issueDocument(testDocHash);
    });

    it("Should return issuer address for valid document", async function () {
      expect(await contract.verifyDocument(testDocHash)).to.equal(issuer1.address);
    });

    it("Should return zero address for non-existent document", async function () {
      expect(await contract.verifyDocument(testDocHash2)).to.equal(ethers.ZeroAddress);
    });

    it("Should return zero address for revoked document", async function () {
      await contract.revokeDocument(testDocHash);
      expect(await contract.verifyDocument(testDocHash)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Is Document Revoked", function () {
    beforeEach(async function () {
      await contract.setIssuer(issuer1.address, true);
      await contract.connect(issuer1).issueDocument(testDocHash);
    });

    it("Should return false for non-revoked document", async function () {
      expect(await contract.isDocumentRevoked(testDocHash)).to.equal(false);
    });

    it("Should return true for revoked document", async function () {
      await contract.revokeDocument(testDocHash);
      expect(await contract.isDocumentRevoked(testDocHash)).to.equal(true);
    });
  });
});
