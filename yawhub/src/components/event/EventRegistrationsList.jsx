// src/components/event/EventRegistrationsList.jsx
import React, { useState, useEffect } from "react";
import eventService from "../../services/eventService";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorAlert from "../common/ErrorAlert";
import "../../styles/components/EventRegistrationsList.css";

const EventRegistrationsList = ({ eventId, eventTitle }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, [eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await eventService.getEventRegistrations(eventId);
      setRegistrations(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconName) => {
    const icons = {
      users: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      search: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      sort: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      ),
      download: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      email: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 7L2 7" />
        </svg>
      ),
      phone: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      department: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      ),
      calendar: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      check: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ),
      close: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      refresh: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
        </svg>
      ),
      export: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    };
    return icons[iconName];
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredRegistrations.map((r) => r._id));
    }
  };

  const handleSelectRegistration = (id) => {
    if (selectedRegistrations.includes(id)) {
      setSelectedRegistrations(selectedRegistrations.filter((r) => r !== id));
    } else {
      setSelectedRegistrations([...selectedRegistrations, id]);
    }
  };

  const handleBulkEmail = () => {
    const selectedEmails = registrations
      .filter((r) => selectedRegistrations.includes(r._id))
      .map((r) => r.email);

    const mailtoLink = `mailto:?bcc=${selectedEmails.join(",")}&subject=Event: ${eventTitle || "Event Update"}`;
    window.location.href = mailtoLink;
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Department",
      "Student ID",
      "Year of Study",
      "Registered On",
    ];
    const data = filteredRegistrations.map((reg) => [
      reg.name,
      reg.email,
      reg.phone || "",
      reg.department || "",
      reg.studentId || "",
      reg.yearOfStudy || "",
      new Date(reg.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations_${eventId}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {sortOrder === "asc" ? (
          <polyline points="18 15 12 9 6 15" />
        ) : (
          <polyline points="6 9 12 15 18 9" />
        )}
      </svg>
    );
  };

  const filteredRegistrations = registrations
    .filter((reg) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        reg.name.toLowerCase().includes(searchLower) ||
        reg.email.toLowerCase().includes(searchLower) ||
        (reg.department &&
          reg.department.toLowerCase().includes(searchLower)) ||
        (reg.studentId && reg.studentId.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="registrations-loading">
        <LoadingSpinner size="large" text="Loading registrations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="registrations-error">
        <ErrorAlert message={error} onClose={() => setError("")} />
        <button className="retry-btn" onClick={fetchRegistrations}>
          {renderIcon("refresh")}
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="registrations-container">
      <div className="registrations-header">
        <div className="header-info">
          <h3>
            {renderIcon("users")}
            Registered Participants
          </h3>
          <span className="registrations-count">
            {registrations.length} participants
          </span>
        </div>

        <div className="header-actions">
          <div className="search-wrapper">
            {renderIcon("search")}
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                {renderIcon("close")}
              </button>
            )}
          </div>

          <button className="export-btn" onClick={handleExportCSV}>
            {renderIcon("export")}
            Export CSV
          </button>

          <button className="refresh-btn" onClick={fetchRegistrations}>
            {renderIcon("refresh")}
          </button>
        </div>
      </div>

      {selectedRegistrations.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span>{selectedRegistrations.length} selected</span>
          </div>
          <div className="bulk-actions">
            <button className="bulk-email-btn" onClick={handleBulkEmail}>
              {renderIcon("email")}
              Email Selected
            </button>
            <button
              className="bulk-cancel-btn"
              onClick={() => setSelectedRegistrations([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {filteredRegistrations.length === 0 ? (
        <div className="registrations-empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h4>No registrations found</h4>
          <p>
            {searchTerm
              ? "Try adjusting your search"
              : "Be the first to register for this event"}
          </p>
        </div>
      ) : (
        <div className="registrations-table-wrapper">
          <table className="registrations-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={
                      selectedRegistrations.length ===
                        filteredRegistrations.length &&
                      filteredRegistrations.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort("name")} className="sortable">
                  Name {getSortIcon("name")}
                </th>
                <th onClick={() => handleSort("email")} className="sortable">
                  Email {getSortIcon("email")}
                </th>
                <th>Phone</th>
                <th>Department</th>
                <th>Student ID</th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="sortable"
                >
                  Registered On {getSortIcon("createdAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr
                  key={reg._id}
                  className={
                    selectedRegistrations.includes(reg._id) ? "selected" : ""
                  }
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.includes(reg._id)}
                      onChange={() => handleSelectRegistration(reg._id)}
                    />
                  </td>
                  <td className="name-cell">
                    <span className="participant-avatar">
                      {reg.name.charAt(0).toUpperCase()}
                    </span>
                    {reg.name}
                  </td>
                  <td>
                    <a href={`mailto:${reg.email}`} className="email-link">
                      {renderIcon("email")}
                      {reg.email}
                    </a>
                  </td>
                  <td>
                    {reg.phone ? (
                      <a href={`tel:${reg.phone}`} className="phone-link">
                        {renderIcon("phone")}
                        {reg.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {reg.department ? (
                      <span className="department-badge">
                        {renderIcon("department")}
                        {reg.department}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{reg.studentId || "-"}</td>
                  <td>
                    <span className="date-cell">
                      {renderIcon("calendar")}
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="registrations-footer">
        <div className="footer-stats">
          Showing {filteredRegistrations.length} of {registrations.length}{" "}
          participants
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationsList;
