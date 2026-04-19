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

    // Track revoked documents
    mapping(bytes32 => bool) public documentRevoked;

    // --- Events ---

    // Emitted when an issuer is added or removed
    event IssuerToggled(address indexed issuerAddress, bool isIssuer);
    
    // Emitted when a new document hash is added
    event DocumentIssued(bytes32 indexed docHash, address indexed issuer);

    // Emitted when admin is transferred
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // Emitted when a document is revoked
    event DocumentRevoked(bytes32 indexed docHash);

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
     * @dev Admin function to transfer admin role to a new address.
     * @param _newAdmin The address of the new admin.
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        require(_newAdmin != admin, "New admin cannot be the same address");
        address previousAdmin = admin;
        admin = _newAdmin;
        emit AdminTransferred(previousAdmin, _newAdmin);
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
     * @dev Admin function to issue a document on behalf of an issuer.
     * @param _docHash The SHA-256 hash of the document.
     * @param _issuerAddress The address of the issuer to attribute the document to.
     */
    function issueDocumentOnBehalf(bytes32 _docHash, address _issuerAddress) public onlyAdmin {
        // Ensure the target address is actually an issuer
        require(isIssuer[_issuerAddress], "Target address is not an issuer");
        
        // Ensure the document hasn't already been issued
        require(documentIssuers[_docHash] == address(0), "Document hash already exists");

        // Store the hash, linking it to the specified issuer's address
        documentIssuers[_docHash] = _issuerAddress;
        emit DocumentIssued(_docHash, _issuerAddress);
    }

    /**
     * @dev Admin function to revoke a document.
     * @param _docHash The SHA-256 hash of the document to revoke.
     */
    function revokeDocument(bytes32 _docHash) public onlyAdmin {
        require(documentIssuers[_docHash] != address(0), "Document does not exist");
        require(!documentRevoked[_docHash], "Document already revoked");
        documentRevoked[_docHash] = true;
        emit DocumentRevoked(_docHash);
    }

    /**
     * @dev Public function to verify a document.
     * Returns the address of the issuer if the hash exists and is not revoked,
     * otherwise returns a "zero address" (0x00...00).
     * @param _docHash The SHA-256 hash to check.
     * @return The address of the issuer (zero if not found or revoked).
     */
    function verifyDocument(bytes32 _docHash) public view returns (address) {
        if (documentRevoked[_docHash]) {
            return address(0);
        }
        return documentIssuers[_docHash];
    }

    /**
     * @dev Public function to check if a document has been revoked.
     * @param _docHash The SHA-256 hash to check.
     * @return True if revoked, false otherwise.
     */
    function isDocumentRevoked(bytes32 _docHash) public view returns (bool) {
        return documentRevoked[_docHash];
    }
}
