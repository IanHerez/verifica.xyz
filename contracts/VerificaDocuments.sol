// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VerificaDocuments
 * @dev Contrato para verificar y registrar documentos en blockchain
 * Compatible con Arbitrum Sepolia y Scroll Sepolia
 */
contract VerificaDocuments is Ownable, ReentrancyGuard {
    struct Document {
        bytes32 documentHash; // Hash SHA-256 del documento
        string ipfsCid; // CID de IPFS del archivo
        address creator; // Dirección del creador
        string title; // Título del documento
        string institution; // Institución emisora
        uint256 createdAt; // Timestamp de creación
        uint256 issuedAt; // Timestamp de emisión
        bool verified; // Estado de verificación
        bool revoked; // Si fue revocado
        address[] signers; // Array de direcciones que firmaron
    }

    struct DocumentSigner {
        address signer; // Dirección del firmante
        uint256 signedAt; // Timestamp de firma
    }

    // Storage
    mapping(bytes32 => Document) public documents; // Hash => Document
    mapping(bytes32 => DocumentSigner[]) public documentSigners; // Hash => Signers
    mapping(address => bytes32[]) public userDocuments; // Usuario => Array de hashes
    mapping(address => bool) public authorizedCreators; // Direcciones autorizadas para crear
    uint256 public documentCount; // Contador total de documentos

    // Events
    event DocumentRegistered(
        bytes32 indexed documentHash,
        address indexed creator,
        string title,
        string institution,
        uint256 createdAt
    );

    event DocumentSigned(
        bytes32 indexed documentHash,
        address indexed signer,
        uint256 signedAt
    );

    event DocumentRevoked(
        bytes32 indexed documentHash,
        address indexed revokedBy,
        uint256 revokedAt
    );

    event CreatorAuthorized(address indexed creator);
    event CreatorRevoked(address indexed creator);

    // Modifiers
    modifier onlyAuthorized() {
        require(
            authorizedCreators[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    modifier documentExists(bytes32 _documentHash) {
        require(
            documents[_documentHash].creator != address(0),
            "Document does not exist"
        );
        _;
    }

    modifier notRevoked(bytes32 _documentHash) {
        require(!documents[_documentHash].revoked, "Document is revoked");
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedCreators[msg.sender] = true; // Owner puede crear
    }

    /**
     * @notice Registra un nuevo documento en blockchain
     * @dev El hash debe ser único y el creador debe estar autorizado
     * @param _documentHash Hash SHA-256 del documento
     * @param _ipfsCid CID de IPFS del archivo
     * @param _title Título del documento
     * @param _institution Institución emisora
     * @param _issuedAt Timestamp de emisión
     * @return true si se registró exitosamente
     */
    function registerDocument(
        bytes32 _documentHash,
        string memory _ipfsCid,
        string memory _title,
        string memory _institution,
        uint256 _issuedAt
    ) public nonReentrant onlyAuthorized returns (bool) {
        require(_documentHash != bytes32(0), "Invalid hash");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required");
        require(bytes(_institution).length > 0, "Institution required");
        require(
            documents[_documentHash].creator == address(0),
            "Document already exists"
        );

        documents[_documentHash] = Document({
            documentHash: _documentHash,
            ipfsCid: _ipfsCid,
            creator: msg.sender,
            title: _title,
            institution: _institution,
            createdAt: block.timestamp,
            issuedAt: _issuedAt,
            verified: true,
            revoked: false,
            signers: new address[](0)
        });

        userDocuments[msg.sender].push(_documentHash);
        documentCount++;

        emit DocumentRegistered(
            _documentHash,
            msg.sender,
            _title,
            _institution,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Firma un documento existente
     * @param _documentHash Hash del documento a firmar
     * @return true si se firmó exitosamente
     */
    function signDocument(
        bytes32 _documentHash
    )
        public
        nonReentrant
        documentExists(_documentHash)
        notRevoked(_documentHash)
        returns (bool)
    {
        Document storage doc = documents[_documentHash];

        // Verificar que el firmante no haya firmado ya
        for (uint256 i = 0; i < doc.signers.length; i++) {
            require(doc.signers[i] != msg.sender, "Already signed");
        }

        // Agregar firmante
        doc.signers.push(msg.sender);

        // Agregar a documentSigners con timestamp
        documentSigners[_documentHash].push(
            DocumentSigner({signer: msg.sender, signedAt: block.timestamp})
        );

        emit DocumentSigned(_documentHash, msg.sender, block.timestamp);

        return true;
    }

    /**
     * @notice Verifica si un documento existe y está verificado
     * @param _documentHash Hash del documento a verificar
     * @return exists true si el documento existe
     * @return document struct completa del documento
     */
    function verifyDocument(
        bytes32 _documentHash
    ) public view returns (bool exists, Document memory document) {
        Document memory doc = documents[_documentHash];
        exists = doc.creator != address(0);
        document = doc;
    }

    /**
     * @notice Revoca un documento (solo owner o creador)
     * @param _documentHash Hash del documento a revocar
     * @return true si se revocó exitosamente
     */
    function revokeDocument(
        bytes32 _documentHash
    ) public nonReentrant documentExists(_documentHash) returns (bool) {
        Document storage doc = documents[_documentHash];
        require(
            doc.creator == msg.sender || msg.sender == owner(),
            "Not authorized to revoke"
        );

        doc.revoked = true;

        emit DocumentRevoked(_documentHash, msg.sender, block.timestamp);

        return true;
    }

    /**
     * @notice Autoriza una dirección para crear documentos (solo owner)
     * @param _creator Dirección a autorizar
     */
    function authorizeCreator(address _creator) public onlyOwner {
        require(_creator != address(0), "Invalid address");
        authorizedCreators[_creator] = true;
        emit CreatorAuthorized(_creator);
    }

    /**
     * @notice Desautoriza una dirección (solo owner)
     * @param _creator Dirección a desautorizar
     */
    function revokeCreator(address _creator) public onlyOwner {
        require(_creator != address(0), "Invalid address");
        authorizedCreators[_creator] = false;
        emit CreatorRevoked(_creator);
    }

    /**
     * @notice Obtiene todos los documentos de un usuario
     * @param _user Dirección del usuario
     * @return Array de hashes de documentos
     */
    function getUserDocuments(
        address _user
    ) public view returns (bytes32[] memory) {
        return userDocuments[_user];
    }

    /**
     * @notice Obtiene todos los firmantes de un documento
     * @param _documentHash Hash del documento
     * @return Array de DocumentSigner
     */
    function getDocumentSigners(
        bytes32 _documentHash
    )
        public
        view
        documentExists(_documentHash)
        returns (DocumentSigner[] memory)
    {
        return documentSigners[_documentHash];
    }

    /**
     * @notice Obtiene el total de documentos registrados
     * @return Total de documentos
     */
    function getTotalDocuments() public view returns (uint256) {
        return documentCount;
    }
}
