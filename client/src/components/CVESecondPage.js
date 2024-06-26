import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

const CVEDetailsPage = () => {
  const { cveId } = useParams();
  const [cveDetails, setCVEDetails] = useState({});
  const [loading, setLoading] = useState(true);

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

  useEffect(() => {
    const fetchCVEDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/cves/${cveId}`);
        const formattedData = formatCVEData(response.data);
        setCVEDetails(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching CVE details:', error);
        setLoading(false);
      }
    };

    fetchCVEDetails();
  }, [cveId]);

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //
  const formatCVEData = (data) => {
    const formattedData = { ...data };

    if (formattedData.cve?.published?.$date) {
      formattedData.cve.published.$date = new Date(formattedData.cve.published.$date).toLocaleDateString();
    }
    if (formattedData.cve?.lastModified?.$date) {
      formattedData.cve.lastModified.$date = new Date(formattedData.cve.lastModified.$date).toLocaleDateString();
    }
    return formattedData;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>CVE Details</h1>

      <p style={styles.text}>CVE ID: {cveDetails.cve?.id}</p>
      <p style={styles.text}>Source Identifier: {cveDetails.cve?.sourceIdentifier}</p>
      <p style={styles.text}>Vulnerability Status: {cveDetails.cve?.vulnStatus}</p>

      <h2 style={styles.heading}>Descriptions</h2>

      {cveDetails.cve?.descriptions && cveDetails.cve.descriptions.length > 0 ? (
        cveDetails.cve.descriptions.map((description, index) => (
          <p key={index} style={styles.text}>{description.value}</p>
        ))
      ) : (
        <p style={styles.text}>No descriptions available</p>
      )}

      <h2 style={styles.heading}>Weaknesses</h2>

      {cveDetails.weaknesses && cveDetails.weaknesses.length > 0 ? (
        cveDetails.weaknesses.map((weakness, index) => (
          <div key={index}>
            <p style={styles.text}>Source: {weakness.source}</p>
            <p style={styles.text}>Type: {weakness.type}</p>

            {weakness.description && weakness.description.length > 0 ? (
              weakness.description.map((desc, descIndex) => (
                <p key={descIndex} style={styles.text}>Description ({desc.lang}): {desc.value}</p>
              ))
            ) : (
              <p style={styles.text}>No description available</p>
            )}
          </div>
        ))
      ) : (
        <p style={styles.text}>No weaknesses available</p>
      )}

      <h2 style={styles.heading}>Configurations</h2>

      {cveDetails.configurations && cveDetails.configurations.length > 0 ? (
        cveDetails.configurations.map((configuration, index) => (
          <div key={index}>
            <h3 style={styles.subheading}>Configuration {index + 1}</h3>

            {configuration.nodes.map((node, nodeIndex) => (
              <div key={nodeIndex}>
                <p style={styles.text}>Operator: {node.operator}</p>
                <p style={styles.text}>Negate: {node.negate.toString()}</p>

                {node.cpeMatch.map((cpeMatch, cpeIndex) => (
                  <div key={cpeIndex}>
                    <p style={styles.text}>Vulnerable: {cpeMatch.vulnerable.toString()}</p>
                    <p style={styles.text}>Criteria: {cpeMatch.criteria}</p>
                    <p style={styles.text}>Match Criteria ID: {cpeMatch.matchCriteriaId}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))
      ) : (
        <p style={styles.text}>No configurations available</p>
      )}

      <h2 style={styles.heading}>References</h2>
      {cveDetails.references && cveDetails.references.length > 0 ? (
        cveDetails.references.map((reference, index) => (
          <div key={index}>
            <p style={styles.text}>Source: {reference.source}</p>
            <p style={styles.text}>URL: {reference.url}</p>
          </div>
        ))
      ) : (
        <p style={styles.text}>No references available</p>
      )}
    </div>
  );
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  subheading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  text: {
    fontSize: '16px',
    marginBottom: '8px',
    color: '#666',
  },
};

export default CVEDetailsPage;
