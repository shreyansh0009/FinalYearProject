// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentVerification
 * @dev A smart contract to manage document authenticity using hashes.
 * Features Role-Based Access Control (RBAC) for an admin and issuers.
 */
contract DocumentVerification {

    // --- State Variables ---

    address public admin; // The admin (university/govt.) who manages issuers
    
    // Mapping to store addresses that have the "issuer" role
    mapping(address => bool) public isIssuer;

    // This is the core data. We map a document's hash (bytes32)
    // to the address that issued it.
    mapping(bytes32 => address) public documentIssuers;

    // --- Events ---

    // Emitted when an issuer is added or removed
    event IssuerToggled(address indexed issuerAddress, bool isIssuer);
    
    // Emitted when a new document hash is added
    event DocumentIssued(bytes32 indexed docHash, address indexed issuer);

    // --- Modifiers ---

    /**
     * @dev Throws an error if called by any account other than the admin.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    /**
     * @dev Throws an error if called by any account that is not an issuer.
     */
    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Caller does not have issuer role");
        _;
    }

    // --- Functions ---

    /**
     * @dev Constructor. Sets the contract deployer as the initial admin.
     */
    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Admin function to grant or revoke the issuer role.
     * @param _issuerAddress The address to add/remove
     * @param _isIssuer The status (true to grant, false to revoke)
     */
    function setIssuer(address _issuerAddress, bool _isIssuer) public onlyAdmin {
        isIssuer[_issuerAddress] = _isIssuer;
        emit IssuerToggled(_issuerAddress, _isIssuer);
    }

    /**
     * @dev Issuer function to add a new document hash to the blockchain.
     * @param _docHash The SHA-256 hash of the document.
     */
    function issueDocument(bytes32 _docHash) public onlyIssuer {
        // Ensure the document hasn't already been issued
        require(documentIssuers[_docHash] == address(0), "Document hash already exists");

        // Store the hash, linking it to the issuer's address
        documentIssuers[_docHash] = msg.sender;
        emit DocumentIssued(_docHash, msg.sender);
    }

    /**
     * @dev Public function to verify a document.
     * Returns the address of the issuer if the hash exists,
     * otherwise returns a "zero address" (0x00...00).
     * @param _docHash The SHA-256 hash to check.
     * @return The address of the issuer.
     */
    function verifyDocument(bytes32 _docHash) public view returns (address) {
        return documentIssuers[_docHash];
    }
}