import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

const CVEList = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    cveID: '',
    publishedDate: '',
    lastModifiedDays: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/cves/list', {
          params: {
            page: currentPage,
            limit: perPage
          }
        });
        setData(response.data.cves);
        setTotalPages(Math.ceil(response.data.totalCount / perPage));
        setTotalRecords(response.data.totalCount);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [currentPage, perPage, filters]);

  // -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  const formatDate = (date) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  // -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  const handleFilter = async () => {
    try {
      const url = `http://localhost:5000/cves/filter/${filters.cveID || 'null'}/${filters.publishedDate || 'null'}/${filters.lastModifiedDays || 'null'}/${currentPage}/${perPage}`;
      const response = await axios.get(url);
      setData(response.data.cves);
      setTotalPages(Math.ceil(response.data.totalCount / perPage));
      setTotalRecords(response.data.totalCount);
    } catch (error) {
      console.error('Error filtering data:', error);
    }
  };

  // -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prevPage => prevPage - 1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center' }}>CVE List</h1>
      <div style={{ marginBottom: '10px' }}>
        <input type="text" name="cveID" value={filters.cveID} onChange={handleInputChange} placeholder="CVE ID" style={{ marginRight: '10px' }} />
        <input type="text" name="publishedDate" value={filters.publishedDate} onChange={handleInputChange} placeholder="CVE Published Date" style={{ marginRight: '10px' }} />
        <input type="text" name="lastModifiedDays" value={filters.lastModifiedDays} onChange={handleInputChange} placeholder="CVE Last Modified Date" style={{ marginRight: '10px' }} />
        <button onClick={handleFilter}>Filter</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <div>
          Total Records: {totalRecords}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <table>
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>Identifier</th>
              <th>Published Date</th>
              <th>Modified Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(entry => (
              <tr key={entry.cve.id}>
                <td><Link to={`/cves/${entry.cve.id}`}>{entry.cve.id}</Link></td>
                <td>{entry.cve.sourceIdentifier}</td>
                <td>{formatDate(new Date(entry.cve.published))}</td>
                <td>{formatDate(new Date(entry.cve.lastModified))}</td>
                <td>{entry.cve.vulnStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', marginTop: '5px' }}>
        <div style={{ marginRight: '10px' }}>
          <label htmlFor="perPageSelect">Results Per Page: </label>
          <select id="perPageSelect" value={perPage} onChange={handlePerPageChange} style={{ marginLeft: '10px' }}>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
          <span style={{ margin: '0 10px' }}>Page {currentPage} of {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default CVEList;
