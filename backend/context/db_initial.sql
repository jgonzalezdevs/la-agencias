-- -----------------------------------------------------
-- Table `Suppliers`
-- Description: Stores information about the providers of travel services (e.g., airlines, hotels, car rental companies).
-- -----------------------------------------------------
CREATE TABLE Suppliers (
  supplier_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('Airline', 'Hotel', 'Car Rental', 'Cruise Line', 'Tour Operator', 'Other') NOT NULL,
  contact_info VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Table `Customers`
-- Description: Stores customer profiles, including their preferences and contact information, acting as a basic CRM.
-- -----------------------------------------------------
CREATE TABLE Customers (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  preferences TEXT, -- Can store JSON or serialized data for travel preferences
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Table `Users`
-- Description: A central table for all system users (operators, administrators, etc.).
-- -----------------------------------------------------
CREATE TABLE Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  start_date DATE,
  is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------
-- Table `Roles`
-- Description: Defines the different roles a user can have within the system.
-- -----------------------------------------------------
CREATE TABLE Roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- -----------------------------------------------------
-- Table `User_Roles`
-- Description: A pivot table to assign multiple roles to users, creating a many-to-many relationship.
-- -----------------------------------------------------
CREATE TABLE User_Roles (
  user_id INT,
  role_id INT,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table `Bookings`
-- Description: The central table that consolidates all travel bookings into a single record.
-- -----------------------------------------------------
CREATE TABLE Bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT,
  user_id INT,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed') NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- -----------------------------------------------------
-- Table `Booking_Items`
-- Description: Details each component of a booking (e.g., a specific flight, hotel stay, or car rental).
-- -----------------------------------------------------
CREATE TABLE Booking_Items (
  item_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  supplier_id INT,
  product_type ENUM('Flight', 'Hotel', 'Car Rental', 'Cruise', 'Ferry', 'Train', 'Other') NOT NULL,
  description TEXT,
  start_date DATETIME,
  end_date DATETIME,
  cost DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  supplier_confirmation_code VARCHAR(100),
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);

-- -----------------------------------------------------
-- Table `Invoices`
-- Description: Manages the financial invoices issued to customers for their bookings.
-- -----------------------------------------------------
CREATE TABLE Invoices (
  invoice_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  issue_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('Unpaid', 'Paid', 'Overdue') NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

-- -----------------------------------------------------
-- Table `Documents` -- REVISED AND IMPROVED TABLE
-- Description: Stores references to uploaded documents, allowing multiple documents per booking and linking to specific booking items.
-- -----------------------------------------------------
CREATE TABLE Documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL, -- The link to the overall booking is mandatory
    booking_item_id INT, -- Optional link to a specific item (flight, hotel, etc.)
    invoice_id INT, -- Optional link to a specific invoice
    document_type ENUM('Ticket', 'Voucher', 'Invoice', 'Itinerary', 'Contract', 'Other') NOT NULL,
    file_path VARCHAR(512) NOT NULL, -- Path or URL to the stored file
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_item_id) REFERENCES Booking_Items(item_id) ON DELETE SET NULL,
    FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Table `Payments`
-- Description: Tracks payments received from customers.
-- -----------------------------------------------------
CREATE TABLE Payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT,
  payment_date DATETIME NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id)
);

-- -----------------------------------------------------
-- Table `Commissions`
-- Description: Calculates and tracks the commissions earned by the agency and individual users (operators).
-- -----------------------------------------------------
CREATE TABLE Commissions (
  commission_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_item_id INT,
  user_id INT,
  agency_commission_amount DECIMAL(10, 2),
  operator_commission_amount DECIMAL(10, 2),
  earned_date DATE,
  status ENUM('Pending', 'Paid') NOT NULL,
  FOREIGN KEY (booking_item_id) REFERENCES Booking_Items(item_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- -----------------------------------------------------
-- Table `Supplier_Reconciliations`
-- Description: Manages the reconciliation of supplier statements, such as IATA's BSP.
-- -----------------------------------------------------
CREATE TABLE Supplier_Reconciliations (
  reconciliation_id INT PRIMARY KEY AUTO_INCREMENT,
  supplier_id INT,
  statement_date DATE NOT NULL,
  statement_file_path VARCHAR(255),
  status ENUM('Pending', 'In Progress', 'Completed', 'Discrepancy') NOT NULL,
  processed_date DATETIME,
  FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);

-- -----------------------------------------------------
-- Example Data Insertion for Roles
-- Description: Populates the Roles table with some initial roles.
-- -----------------------------------------------------
INSERT INTO Roles (role_name, description) VALUES
('Operator', 'Can create and manage travel bookings.'),
('Administrator', 'Has full access to all system functionalities, including user management.'),
('Accountant', 'Can manage invoices, payments, and financial reconciliations.');
