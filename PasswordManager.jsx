import React, { useState, useEffect } from "react";
import { TbEdit, TbEditOff } from "react-icons/tb";
import styles from "./PasswordManager.module.css";
import { MdOutlineDelete, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { VscSaveAs } from "react-icons/vsc";
import axios from "axios";
import { Toaster, toast } from "sonner";
import PasswordStrengthBar from "react-password-strength-bar";

function PasswordCard({
  _id,
  accountType,
  email,
  password,
  lastModified,
  onSave,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccountType, setEditedAccountType] = useState(accountType);
  const [editedEmail, setEditedEmail] = useState(email);
  const [editedPassword, setEditedPassword] = useState(password);
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState("");

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/account/updateById/${_id}`, {
        accountType: editedAccountType,
        email: editedEmail,
        password: editedPassword,
        lastModified: "just now",
      });
      onSave(_id, {
        accountType: editedAccountType,
        email: editedEmail,
        password: editedPassword,
        lastModified: "just now",
      });
      setIsEditing(false);
      toast.success("Data Updated Successfully");
    } catch (error) {
      toast.success("Error updating entry:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/account/delete/${_id}`);
      onDelete(_id);
      toast.success("Data Deleted Successfully");
    } catch (error) {
      toast.success("Error deleting entry:", error);
    }
  };

  const handleShowPassword = async () => {
    if (!showPassword) {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/account/decrypt-password",
          { encryptedPassword: password }
        );
        setDecryptedPassword(response.data.password);
        setShowPassword(true);
      } catch (error) {
        toast.error("Failed to decrypt password");
      }
    } else {
      setShowPassword(false);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardContent}>
        {isEditing ? (
          <>
            <h3 className={styles.CaptionInputText}>Account Type</h3>
            <input
              type="text"
              value={editedAccountType}
              onChange={(e) => setEditedAccountType(e.target.value)}
              className={styles.input}
            />
            <h3 className={styles.CaptionInputText}>Email</h3>
            <input
              type="email"
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className={styles.input}
            />
            <h3 className={styles.CaptionInputText}>Password</h3>
            <input
              type={showPassword ? "text" : "password"}
              value={editedPassword}
              onChange={(e) => setEditedPassword(e.target.value)}
              className={styles.input}
            />
            <button
              onClick={handleShowPassword}
              className={styles.passwordToggleButton}
            >
              {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
          </>
        ) : (
          <>
            <h3 className={styles.CaptionText}>Account Type</h3>
            <h2 className={styles.accountType}>{accountType}</h2>
            <h3 className={styles.CaptionText}>Email</h3>
            <p className={styles.email}>{email}</p>
            <h3 className={styles.CaptionText}>Password</h3>
            <p className={styles.password}>
              {showPassword ? decryptedPassword : "••••••••"}
            </p>
            <button
              onClick={handleShowPassword}
              className={styles.passwordToggleButton}
            >
              {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
            <p className={styles.lastModified}>Last modified: {lastModified}</p>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <TbEditOff size={17} className={styles.editIcon} />
          ) : (
            <TbEdit size={17} className={styles.editIcon} />
          )}
        </button>
        <button
          className={styles.actionButton}
          onClick={isEditing ? handleSave : handleDelete}
        >
          {isEditing ? (
            <VscSaveAs size={17} className={styles.viewIcon} />
          ) : (
            <MdOutlineDelete size={17} className={styles.viewIcon} />
          )}
        </button>
        {!isEditing && (
          <button className={styles.actionButton} onClick={handleShowPassword}>
            {showPassword ? (
              <MdVisibilityOff size={17} className={styles.viewIcon} />
            ) : (
              <MdVisibility size={17} className={styles.viewIcon} />
            )}
          </button>
        )}
      </div>
    </article>
  );
}

function PasswordGrid({ passwordEntries, onSave, onDelete, searchText = "" }) {
  const filteredEntries = passwordEntries.filter((entry) =>
    entry.accountType?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className={styles.gridContainer}>
      {filteredEntries.length === 0 ? (
        <p className={styles.noDataText}>No data available</p>
      ) : (
        <div className={styles.grid}>
          {filteredEntries.map((entry) => (
            <div key={entry._id} className={styles.column}>
              <PasswordCard {...entry} onSave={onSave} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordHeader({ onAddNew, searchText, setSearchText }) {
  return (
    <header className={styles.header}>
      <Toaster position="bottom-right" visibleToasts={1} />
      <input
        type="text"
        placeholder="Search by Account Type"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className={styles.searchInput}
      />
      <button className={styles.addButton} onClick={onAddNew}>
        + Add New
      </button>
    </header>
  );
}

function generateRandomPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

function Modal({ isOpen, onClose, onSave }) {
  const [accountType, setAccountType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    setAccountType("");
    setEmail("");
    setPassword("");
    onClose();
  };

  const handleSave = () => {
    onSave({ accountType, email, password });
    setAccountType("");
    setEmail("");
    setPassword("");
  };

  const handleGeneratePassword = (length) => {
    const randomPassword = generateRandomPassword(length);
    setPassword(randomPassword);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const isSaveDisabled = !accountType || !email || !password;

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Add New Password</h2>
        <input
          type="text"
          placeholder="Account Type"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className={styles.NewInput}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.NewInput}
        />
        <div className={styles.passwordInputContainer}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.NewInput}
          />
          <button
            onClick={toggleShowPassword}
            className={styles.passwordToggleButton}
          >
            {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
          </button>
        </div>

        <PasswordStrengthBar
          password={password}
          className={styles.PasswordStrengthBar}
        />
        <button
          onClick={() => handleGeneratePassword(20)}
          className={styles.generateButton}
        >
          Generate Password
        </button>
        <div className={styles.modalActions}>
          <button onClick={handleClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`${styles.saveButton} ${
              isSaveDisabled ? styles.disabledButton : ""
            }`}
            disabled={isSaveDisabled}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordEntries, setPasswordEntries] = useState([]);
  const [searchText, setSearchText] = useState("");

  const fetchData = async () => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await axios.get(
        `http://localhost:5000/api/account/data/${userId}`
      );
      if (response.status === 404) {
        setPasswordEntries([]);
        toast.error("No data found");
      } else {
        setPasswordEntries(response.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (newEntry) => {
    const userId = localStorage.getItem("userId");

    try {
      await axios.post("http://localhost:5000/api/account/create", {
        accountType: newEntry.accountType,
        email: newEntry.email,
        password: newEntry.password,
        userId: userId,
      });
      toast.success("Event has been created");
      fetchData();
    } catch (error) {
      alert.error("Error saving new entry:", error);
    }

    setIsModalOpen(false);
  };

  const handleUpdate = (_id, updatedEntry) => {
    const updatedEntries = passwordEntries.map((entry) =>
      entry._id === _id ? { ...entry, ...updatedEntry } : entry
    );
    setPasswordEntries(updatedEntries);
  };

  const handleDelete = (_id) => {
    const updatedEntries = passwordEntries.filter((entry) => entry._id !== _id);
    setPasswordEntries(updatedEntries);
  };

  return (
    <section className={styles.passwordManager}>
      <div className={styles.container}>
        <PasswordHeader
          onAddNew={handleAddNew}
          searchText={searchText}
          setSearchText={setSearchText}
        />
        <PasswordGrid
          passwordEntries={passwordEntries}
          onSave={handleUpdate}
          onDelete={handleDelete}
          searchText={searchText}
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </section>
  );
}

export default Dashboard;
