// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LibraryBookRegistry
 * @dev Smart contract for managing and tracking college library books on the blockchain.
 * Implements book registration, issuing to borrowers, book returns, availability checks,
 * and emits blockchain events for verifiable tracking.
 */
contract LibraryBookRegistry {
    // Enum representing the operational status of a library book
    enum BookStatus {
        Available,
        Issued
    }

    // Structure representing an individual library book record
    struct Book {
        string bookId;
        string title;
        string author;
        string isbn;
        BookStatus status;
        address currentBorrower;
        uint256 registrationTimestamp;
    }

    // Address of the authorized librarian (contract administrator)
    address public librarian;

    // Mapping from unique bookId to Book record
    mapping(string => Book) private books;

    // Mapping to track if a bookId has already been registered
    mapping(string => bool) private _bookExists;

    // Array containing all registered book IDs for enumeration
    string[] private allBookIds;

    // -------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------

    /**
     * @dev Emitted when a new book is registered on-chain.
     */
    event BookRegistered(
        string bookId,
        string title,
        string author,
        string isbn,
        uint256 timestamp
    );

    /**
     * @dev Emitted when a book is issued to a student borrower.
     */
    event BookIssued(
        string bookId,
        address indexed borrower,
        uint256 timestamp
    );

    /**
     * @dev Emitted when an issued book is returned to the library.
     */
    event BookReturned(
        string bookId,
        address indexed borrower,
        uint256 timestamp
    );

    /**
     * @dev Emitted when the librarian role is transferred to a new address.
     */
    event LibrarianTransferred(
        address indexed previousLibrarian,
        address indexed newLibrarian
    );

    // -------------------------------------------------------------
    // MODIFIERS
    // -------------------------------------------------------------

    /**
     * @dev Restricts execution to only the authorized librarian.
     */
    modifier onlyLibrarian() {
        require(
            msg.sender == librarian,
            "LibraryBookRegistry: caller is not authorized librarian"
        );
        _;
    }

    /**
     * @dev Checks that a book with the given ID exists.
     */
    modifier bookMustExist(string calldata _bookId) {
        require(
            _bookExists[_bookId],
            "LibraryBookRegistry: book does not exist"
        );
        _;
    }

    // -------------------------------------------------------------
    // CONSTRUCTOR
    // -------------------------------------------------------------

    /**
     * @dev Sets the deployer as the initial authorized librarian.
     */
    constructor() {
        librarian = msg.sender;
        emit LibrarianTransferred(address(0), msg.sender);
    }

    // -------------------------------------------------------------
    // CORE FUNCTIONS
    // -------------------------------------------------------------

    /**
     * @notice Registers a new book in the library registry.
     * @dev Only the authorized librarian can call this function.
     * @param _bookId Unique identifier for the book (e.g. "LIB-CS-001").
     * @param _title Title of the book.
     * @param _author Author of the book.
     * @param _isbn International Standard Book Number.
     */
    function registerBook(
        string calldata _bookId,
        string calldata _title,
        string calldata _author,
        string calldata _isbn
    ) external onlyLibrarian {
        require(bytes(_bookId).length > 0, "LibraryBookRegistry: book ID cannot be empty");
        require(bytes(_title).length > 0, "LibraryBookRegistry: title cannot be empty");
        require(bytes(_author).length > 0, "LibraryBookRegistry: author cannot be empty");
        require(bytes(_isbn).length > 0, "LibraryBookRegistry: ISBN cannot be empty");
        require(!_bookExists[_bookId], "LibraryBookRegistry: book already registered");

        books[_bookId] = Book({
            bookId: _bookId,
            title: _title,
            author: _author,
            isbn: _isbn,
            status: BookStatus.Available,
            currentBorrower: address(0),
            registrationTimestamp: block.timestamp
        });

        _bookExists[_bookId] = true;
        allBookIds.push(_bookId);

        emit BookRegistered(_bookId, _title, _author, _isbn, block.timestamp);
    }

    /**
     * @notice Issues an available book to a student borrower.
     * @dev Only the authorized librarian can call this function.
     * @param _bookId Unique identifier of the book to issue.
     * @param _borrower Wallet address of the student borrower.
     */
    function issueBook(
        string calldata _bookId,
        address _borrower
    ) external onlyLibrarian bookMustExist(_bookId) {
        require(_borrower != address(0), "LibraryBookRegistry: invalid borrower address");
        require(
            books[_bookId].status == BookStatus.Available,
            "LibraryBookRegistry: book is already issued"
        );

        books[_bookId].status = BookStatus.Issued;
        books[_bookId].currentBorrower = _borrower;

        emit BookIssued(_bookId, _borrower, block.timestamp);
    }

    /**
     * @notice Records the return of an issued book.
     * @dev Only the authorized librarian can call this function.
     * @param _bookId Unique identifier of the book being returned.
     */
    function returnBook(
        string calldata _bookId
    ) external onlyLibrarian bookMustExist(_bookId) {
        require(
            books[_bookId].status == BookStatus.Issued,
            "LibraryBookRegistry: book is already available"
        );

        address prevBorrower = books[_bookId].currentBorrower;

        books[_bookId].status = BookStatus.Available;
        books[_bookId].currentBorrower = address(0);

        emit BookReturned(_bookId, prevBorrower, block.timestamp);
    }

    // -------------------------------------------------------------
    // VIEW / QUERY FUNCTIONS
    // -------------------------------------------------------------

    /**
     * @notice Returns the full details of a registered book.
     * @param _bookId Unique identifier of the book.
     * @return Book struct containing book details.
     */
    function getBook(
        string calldata _bookId
    ) external view bookMustExist(_bookId) returns (Book memory) {
        return books[_bookId];
    }

    /**
     * @notice Checks whether a registered book is currently available for borrowing.
     * @param _bookId Unique identifier of the book.
     * @return bool True if available, false if currently issued.
     */
    function isBookAvailable(
        string calldata _bookId
    ) external view bookMustExist(_bookId) returns (bool) {
        return books[_bookId].status == BookStatus.Available;
    }

    /**
     * @notice Returns the current tracking state of a book.
     * @param _bookId Unique identifier of the book.
     * @return bookId The unique book identifier.
     * @return status Current status (Available or Issued).
     * @return currentBorrower Address of the borrower if currently issued.
     * @return registrationTimestamp Block timestamp when registered.
     */
    function getBookHistory(
        string calldata _bookId
    )
        external
        view
        bookMustExist(_bookId)
        returns (
            string memory bookId,
            BookStatus status,
            address currentBorrower,
            uint256 registrationTimestamp
        )
    {
        Book storage b = books[_bookId];
        return (b.bookId, b.status, b.currentBorrower, b.registrationTimestamp);
    }

    /**
     * @notice Returns the total count of registered books.
     * @return uint256 Total number of books in the registry.
     */
    function totalBooks() external view returns (uint256) {
        return allBookIds.length;
    }

    /**
     * @notice Returns the list of all registered book IDs.
     * @return string[] Array of book IDs.
     */
    function getAllBookIds() external view returns (string[] memory) {
        return allBookIds;
    }

    /**
     * @notice Returns all registered books.
     * @dev Useful for frontend catalogue hydration.
     * @return Book[] Array of all registered Book structs.
     */
    function getAllBooks() external view returns (Book[] memory) {
        uint256 length = allBookIds.length;
        Book[] memory result = new Book[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = books[allBookIds[i]];
        }
        return result;
    }

    /**
     * @notice Checks if a book exists in the registry.
     * @param _bookId Unique identifier of the book.
     * @return bool True if registered, false otherwise.
     */
    function exists(string calldata _bookId) external view returns (bool) {
        return _bookExists[_bookId];
    }

    // -------------------------------------------------------------
    // ADMINISTRATION
    // -------------------------------------------------------------

    /**
     * @notice Transfers the librarian administration role to a new address.
     * @param _newLibrarian Address of the new librarian.
     */
    function transferLibrarian(address _newLibrarian) external onlyLibrarian {
        require(
            _newLibrarian != address(0),
            "LibraryBookRegistry: invalid new librarian address"
        );
        require(
            _newLibrarian != librarian,
            "LibraryBookRegistry: already the current librarian"
        );
        address prev = librarian;
        librarian = _newLibrarian;
        emit LibrarianTransferred(prev, _newLibrarian);
    }
}
