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
        address[] recipients; // Array de direcciones destinatarias (pueden firmar)
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
    mapping(bytes32 => mapping(address => bool)) public isRecipient; // Hash => Address => Es destinatario
    mapping(address => bytes32[]) public userDocuments; // Usuario => Array de hashes de documentos donde es destinatario o creador
    mapping(address => bool) public authorizedCreators; // Direcciones autorizadas para crear
    uint256 public documentCount; // Contador total de documentos

    // Constantes
    uint256 public constant MAX_RECIPIENTS = 50; // Límite máximo de destinatarios por documento

    // Events
    event DocumentRegistered(
        bytes32 indexed documentHash,
        address indexed creator,
        string title,
        string institution,
        address[] recipients,
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
     * @dev Según el flujo de arquitectura:
     *      1. El archivo ya debe estar subido a IPFS (obtener CID primero)
     *      2. El hash SHA-256 debe ser calculado antes de llamar a esta función
     *      3. Guarda datos críticos: hash, CID, título, institución, destinatarios
     *      4. Metadata adicional (description, category) NO se guarda aquí
     * @param _documentHash Hash SHA-256 del documento
     * @param _ipfsCid CID de IPFS del archivo (debe obtenerse primero subiendo a IPFS)
     * @param _title Título del documento
     * @param _institution Institución emisora
     * @param _recipients Array de direcciones destinatarias (solo ellos pueden firmar)
     * @param _issuedAt Timestamp de emisión (Unix timestamp en segundos)
     * @return true si se registró exitosamente
     */
    function registerDocument(
        bytes32 _documentHash,
        string memory _ipfsCid,
        string memory _title,
        string memory _institution,
        address[] memory _recipients,
        uint256 _issuedAt
    ) public nonReentrant onlyAuthorized returns (bool) {
        // Validaciones según flujo
        require(_documentHash != bytes32(0), "Invalid hash");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required");
        require(bytes(_institution).length > 0, "Institution required");
        require(_recipients.length > 0, "At least one recipient required");
        require(_recipients.length <= MAX_RECIPIENTS, "Too many recipients");
        require(
            documents[_documentHash].creator == address(0),
            "Document already exists"
        );
        require(_issuedAt > 0, "Invalid issuedAt timestamp");

        // Validar que no hay direcciones duplicadas o inválidas
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient address");
            // Verificar duplicados
            for (uint256 j = i + 1; j < _recipients.length; j++) {
                require(
                    _recipients[i] != _recipients[j],
                    "Duplicate recipient"
                );
            }
        }

        documents[_documentHash] = Document({
            documentHash: _documentHash,
            ipfsCid: _ipfsCid,
            creator: msg.sender,
            title: _title,
            institution: _institution,
            recipients: _recipients,
            createdAt: block.timestamp,
            issuedAt: _issuedAt,
            verified: true,
            revoked: false,
            signers: new address[](0)
        });

        // Indexar destinatarios para búsqueda rápida
        for (uint256 i = 0; i < _recipients.length; i++) {
            isRecipient[_documentHash][_recipients[i]] = true;
            // Agregar a userDocuments para consulta rápida
            userDocuments[_recipients[i]].push(_documentHash);
        }

        // También agregar al creador a userDocuments
        userDocuments[msg.sender].push(_documentHash);

        documentCount++;

        emit DocumentRegistered(
            _documentHash,
            msg.sender,
            _title,
            _institution,
            _recipients,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Firma un documento existente
     * @dev Solo los destinatarios pueden firmar un documento
     *      El estado de firma también se actualiza en base de datos, pero
     *      esta función garantiza inmutabilidad en blockchain
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

        // NUEVO: Verificar que el firmante sea destinatario
        require(
            isRecipient[_documentHash][msg.sender],
            "Not authorized to sign - not a recipient"
        );

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
     * @notice Obtiene todos los documentos de un usuario (como creador o destinatario)
     * @param _user Dirección del usuario
     * @return Array de hashes de documentos
     */
    function getUserDocuments(
        address _user
    ) public view returns (bytes32[] memory) {
        return userDocuments[_user];
    }

    /**
     * @notice Obtiene el CID de IPFS de un documento para recuperar el archivo
     * @param _documentHash Hash del documento
     * @return CID de IPFS del archivo
     */
    function getDocumentIpfsCid(
        bytes32 _documentHash
    ) public view documentExists(_documentHash) returns (string memory) {
        return documents[_documentHash].ipfsCid;
    }

    /**
     * @notice Verifica si un usuario puede firmar un documento (es destinatario)
     * @param _documentHash Hash del documento
     * @param _signer Dirección del firmante
     * @return true si puede firmar
     */
    function canSignDocument(
        bytes32 _documentHash,
        address _signer
    ) public view documentExists(_documentHash) returns (bool) {
        return isRecipient[_documentHash][_signer];
    }

    /**
     * @notice Obtiene todos los destinatarios de un documento
     * @param _documentHash Hash del documento
     * @return Array de direcciones destinatarias
     */
    function getDocumentRecipients(
        bytes32 _documentHash
    ) public view documentExists(_documentHash) returns (address[] memory) {
        return documents[_documentHash].recipients;
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
