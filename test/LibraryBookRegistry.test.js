import { expect } from "chai";
import hre from "hardhat";

describe("LibraryBookRegistry Smart Contract", function () {
  let libraryRegistry;
  let librarian;
  let student1;
  let student2;
  let unauthorizedUser;

  const sampleBook = {
    id: "CS-AI-101",
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
  };

  const sampleBook2 = {
    id: "CS-DB-202",
    title: "Database System Concepts",
    author: "Abraham Silberschatz",
    isbn: "978-0078022159",
  };

  beforeEach(async function () {
    [librarian, student1, student2, unauthorizedUser] = await hre.ethers.getSigners();

    const LibraryBookRegistry = await hre.ethers.getContractFactory("LibraryBookRegistry");
    libraryRegistry = await LibraryBookRegistry.deploy();
    await libraryRegistry.waitForDeployment();
  });

  describe("Deployment & Initial State", function () {
    it("Should set the deployer as the initial librarian", async function () {
      expect(await libraryRegistry.librarian()).to.equal(librarian.address);
    });

    it("Should start with 0 total registered books", async function () {
      expect(await libraryRegistry.totalBooks()).to.equal(0);
      const ids = await libraryRegistry.getAllBookIds();
      expect(ids.length).to.equal(0);
    });
  });

  describe("1. Successful book registration", function () {
    it("Should allow the librarian to register a new book", async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );

      expect(await libraryRegistry.totalBooks()).to.equal(1);
      expect(await libraryRegistry.exists(sampleBook.id)).to.be.true;

      const book = await libraryRegistry.getBook(sampleBook.id);
      expect(book.bookId).to.equal(sampleBook.id);
      expect(book.title).to.equal(sampleBook.title);
      expect(book.author).to.equal(sampleBook.author);
      expect(book.isbn).to.equal(sampleBook.isbn);
      expect(book.status).to.equal(0); // BookStatus.Available
      expect(book.currentBorrower).to.equal(hre.ethers.ZeroAddress);
      expect(book.registrationTimestamp).to.be.greaterThan(0);
    });
  });

  describe("2. Duplicate book registration reverts", function () {
    it("Should revert when attempting to register a book with an existing ID", async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );

      await expect(
        libraryRegistry.connect(librarian).registerBook(
          sampleBook.id,
          "Different Title",
          "Different Author",
          "978-0000000000"
        )
      ).to.be.revertedWith("LibraryBookRegistry: book already registered");
    });
  });

  describe("3. Empty fields rejection (Title, ID, Author, ISBN)", function () {
    it("Should reject an empty book title", async function () {
      await expect(
        libraryRegistry.connect(librarian).registerBook(
          sampleBook.id,
          "",
          sampleBook.author,
          sampleBook.isbn
        )
      ).to.be.revertedWith("LibraryBookRegistry: title cannot be empty");
    });

    it("Should reject an empty book ID", async function () {
      await expect(
        libraryRegistry.connect(librarian).registerBook(
          "",
          sampleBook.title,
          sampleBook.author,
          sampleBook.isbn
        )
      ).to.be.revertedWith("LibraryBookRegistry: book ID cannot be empty");
    });

    it("Should reject an empty author", async function () {
      await expect(
        libraryRegistry.connect(librarian).registerBook(
          sampleBook.id,
          sampleBook.title,
          "",
          sampleBook.isbn
        )
      ).to.be.revertedWith("LibraryBookRegistry: author cannot be empty");
    });

    it("Should reject an empty ISBN", async function () {
      await expect(
        libraryRegistry.connect(librarian).registerBook(
          sampleBook.id,
          sampleBook.title,
          sampleBook.author,
          ""
        )
      ).to.be.revertedWith("LibraryBookRegistry: ISBN cannot be empty");
    });
  });

  describe("4. Existing book details are returned correctly", function () {
    it("Should return correct book details and availability", async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );

      const book = await libraryRegistry.getBook(sampleBook.id);
      expect(book.bookId).to.equal(sampleBook.id);
      expect(book.title).to.equal(sampleBook.title);
      expect(book.author).to.equal(sampleBook.author);
      expect(book.isbn).to.equal(sampleBook.isbn);
      expect(book.status).to.equal(0);
      expect(await libraryRegistry.isBookAvailable(sampleBook.id)).to.be.true;

      const history = await libraryRegistry.getBookHistory(sampleBook.id);
      expect(history.bookId).to.equal(sampleBook.id);
      expect(history.status).to.equal(0);
      expect(history.currentBorrower).to.equal(hre.ethers.ZeroAddress);
    });

    it("Should revert when querying a non-existent book", async function () {
      await expect(
        libraryRegistry.getBook("NON-EXISTENT-ID")
      ).to.be.revertedWith("LibraryBookRegistry: book does not exist");
    });
  });

  describe("5. Successful book issue", function () {
    beforeEach(async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
    });

    it("Should allow the librarian to issue an available book to a student", async function () {
      await libraryRegistry.connect(librarian).issueBook(sampleBook.id, student1.address);

      const book = await libraryRegistry.getBook(sampleBook.id);
      expect(book.status).to.equal(1); // BookStatus.Issued
      expect(book.currentBorrower).to.equal(student1.address);
      expect(await libraryRegistry.isBookAvailable(sampleBook.id)).to.be.false;
    });

    it("Should revert if borrower address is address(0)", async function () {
      await expect(
        libraryRegistry.connect(librarian).issueBook(sampleBook.id, hre.ethers.ZeroAddress)
      ).to.be.revertedWith("LibraryBookRegistry: invalid borrower address");
    });
  });

  describe("6. Issuing a book that is already issued reverts", function () {
    beforeEach(async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
      await libraryRegistry.connect(librarian).issueBook(sampleBook.id, student1.address);
    });

    it("Should revert when attempting to issue an already issued book", async function () {
      await expect(
        libraryRegistry.connect(librarian).issueBook(sampleBook.id, student2.address)
      ).to.be.revertedWith("LibraryBookRegistry: book is already issued");
    });
  });

  describe("7. Successful book return", function () {
    beforeEach(async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
      await libraryRegistry.connect(librarian).issueBook(sampleBook.id, student1.address);
    });

    it("Should allow returning an issued book and reset status to Available", async function () {
      await libraryRegistry.connect(librarian).returnBook(sampleBook.id);

      const book = await libraryRegistry.getBook(sampleBook.id);
      expect(book.status).to.equal(0); // Available
      expect(book.currentBorrower).to.equal(hre.ethers.ZeroAddress);
      expect(await libraryRegistry.isBookAvailable(sampleBook.id)).to.be.true;
    });
  });

  describe("8. Returning a book that is already available reverts", function () {
    beforeEach(async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
    });

    it("Should revert when attempting to return a book that is not issued", async function () {
      await expect(
        libraryRegistry.connect(librarian).returnBook(sampleBook.id)
      ).to.be.revertedWith("LibraryBookRegistry: book is already available");
    });
  });

  describe("9. Unauthorized book registration reverts", function () {
    it("Should revert when non-librarian attempts to register a book", async function () {
      await expect(
        libraryRegistry.connect(unauthorizedUser).registerBook(
          sampleBook.id,
          sampleBook.title,
          sampleBook.author,
          sampleBook.isbn
        )
      ).to.be.revertedWith("LibraryBookRegistry: caller is not authorized librarian");
    });
  });

  describe("10. Unauthorized book issue reverts", function () {
    beforeEach(async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
    });

    it("Should revert when non-librarian attempts to issue a book", async function () {
      await expect(
        libraryRegistry.connect(unauthorizedUser).issueBook(sampleBook.id, student1.address)
      ).to.be.revertedWith("LibraryBookRegistry: caller is not authorized librarian");
    });
  });

  describe("11. Unauthorized book return reverts", function () {
    beforeEach(async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
      await libraryRegistry.connect(librarian).issueBook(sampleBook.id, student1.address);
    });

    it("Should revert when non-librarian attempts to return a book", async function () {
      await expect(
        libraryRegistry.connect(unauthorizedUser).returnBook(sampleBook.id)
      ).to.be.revertedWith("LibraryBookRegistry: caller is not authorized librarian");
    });
  });

  describe("12. Events are emitted with the expected arguments", function () {
    it("Should emit BookRegistered with correct parameters", async function () {
      const tx = await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );

      await expect(tx)
        .to.emit(libraryRegistry, "BookRegistered")
        .withArgs(
          sampleBook.id,
          sampleBook.title,
          sampleBook.author,
          sampleBook.isbn,
          (timestamp) => timestamp > 0
        );
    });

    it("Should emit BookIssued with correct parameters", async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );

      const tx = await libraryRegistry.connect(librarian).issueBook(
        sampleBook.id,
        student1.address
      );

      await expect(tx)
        .to.emit(libraryRegistry, "BookIssued")
        .withArgs(sampleBook.id, student1.address, (timestamp) => timestamp > 0);
    });

    it("Should emit BookReturned with correct parameters", async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
      await libraryRegistry.connect(librarian).issueBook(
        sampleBook.id,
        student1.address
      );

      const tx = await libraryRegistry.connect(librarian).returnBook(sampleBook.id);

      await expect(tx)
        .to.emit(libraryRegistry, "BookReturned")
        .withArgs(sampleBook.id, student1.address, (timestamp) => timestamp > 0);
    });
  });

  describe("13. Book availability changes correctly after issue and return", function () {
    it("Should accurately track availability cycle: Available -> Issued -> Available", async function () {
      // 1. Initially registered -> Available
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
      expect(await libraryRegistry.isBookAvailable(sampleBook.id)).to.be.true;

      // 2. Issued -> Not Available
      await libraryRegistry.connect(librarian).issueBook(sampleBook.id, student1.address);
      expect(await libraryRegistry.isBookAvailable(sampleBook.id)).to.be.false;

      // 3. Returned -> Available again
      await libraryRegistry.connect(librarian).returnBook(sampleBook.id);
      expect(await libraryRegistry.isBookAvailable(sampleBook.id)).to.be.true;
    });

    it("Should return all books through getAllBooks helper", async function () {
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook.id,
        sampleBook.title,
        sampleBook.author,
        sampleBook.isbn
      );
      await libraryRegistry.connect(librarian).registerBook(
        sampleBook2.id,
        sampleBook2.title,
        sampleBook2.author,
        sampleBook2.isbn
      );

      const allBooks = await libraryRegistry.getAllBooks();
      expect(allBooks.length).to.equal(2);
      expect(allBooks[0].bookId).to.equal(sampleBook.id);
      expect(allBooks[1].bookId).to.equal(sampleBook2.id);
    });
  });
});
