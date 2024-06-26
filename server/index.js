require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

const app = express();

const User = require('./models/user');

const PORT = process.env.PORT || 4000;

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => {
    console.error('Database connection error:', error);
});
db.once('open', () => {
    console.log('Database connection successful!!');
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

const transformData = (vulnerability) => {
    const cveID = vulnerability.cve.id || "";
    const sourceIdentifier = vulnerability.cve.sourceIdentifier || "";
    const publishedDate = vulnerability.cve.published ? new Date(vulnerability.cve.published) : null;
    const modifiedDate = vulnerability.cve.lastModified ? new Date(vulnerability.cve.lastModified) : null;
    const status = vulnerability.cve.vulnStatus || "";
    const descriptions = vulnerability.cve.descriptions || [];
    
     const metricsData = vulnerability.metrics?.cvssMetricV2; 
    
     const metrics = metricsData ? {
         source: metricsData.source || "",
         type: metricsData.type || "",
         cvssData: {
             version: metricsData.cvssData.version || "",
             vectorString: metricsData.cvssData.vectorString || "",
             accessVector: metricsData.cvssData.accessVector || "",
             accessComplexity: metricsData.cvssData.accessComplexity || "",
             authentication: metricsData.cvssData.authentication || "",
             confidentialityImpact: metricsData.cvssData.confidentialityImpact || "",
             integrityImpact: metricsData.cvssData.integrityImpact || "",
             availabilityImpact: metricsData.cvssData.availabilityImpact || "",
             baseScore: metricsData.cvssData.baseScore || 0
         },
         baseSeverity: metricsData.baseSeverity || "",
         exploitabilityScore: metricsData.exploitabilityScore || 0,
         impactScore: metricsData.impactScore || 0,
         acInsufInfo: metricsData.acInsufInfo || false,
         obtainAllPrivilege: metricsData.obtainAllPrivilege || false,
         obtainUserPrivilege: metricsData.obtainUserPrivilege || false,
         obtainOtherPrivilege: metricsData.obtainOtherPrivilege || false,
         userInteractionRequired: metricsData.userInteractionRequired || false
     } : {};
 
    
    const weaknesses = vulnerability.cve.weaknesses || [];
    const configurations = vulnerability.cve.configurations || [];
    const references = vulnerability.cve.references || [];

    return {
        cve: {
            id: cveID,
            sourceIdentifier,
            published: publishedDate,
            lastModified: modifiedDate,
            vulnStatus: status,
            descriptions,
            metrics
        },
        weaknesses,
        configurations,
        references
    };
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

const fetchDataFromAPI = async () => {
    try {
        const response = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0');
        const vulnerabilities = response.data?.vulnerabilities || [];
        const formattedData = vulnerabilities.map(transformData);
        await User.deleteMany({});
        await User.insertMany(formattedData);
        console.log('Data fetched and stored successfully');
    } catch (error) {
        console.error('Error fetching and storing the data:', error.message);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

cron.schedule('0 * * * *', () => {
    fetchDataFromAPI();
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

app.get('/cves/list', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [cves, totalCount] = await Promise.all([
          User.find({}, { _id: 0, 'cve.id': 1, 'cve.sourceIdentifier':1, 'cve.published': 1, 'cve.lastModified': 1, 'cve.vulnStatus': 1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
          User.countDocuments()
        ]);
        
        res.json({ cves, totalCount });
    } catch (error) {
        console.error('Error retrieving paginated CVEs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

app.get('/cves/:cveID', async (req, res) => {
    const cveID = req.params.cveID;
    try {
        const cve = await User.findOne({ 'cve.id': cveID }, { _id: 0, cve: 1, weaknesses: 1, configurations: 1, references: 1 });
        if (cve) {
            res.json(cve);
        } else {
            res.status(404).send('CVE not found');
        }
    } catch (error) {
        console.error('Error retrieving CVE:', error);
        res.status(500).send('Internal Server Error');
    }
});

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

app.get('/cves/filter/:cveID/:publishedDate/:lastModifiedDate/:page/:limit', async (req, res) => {
    try {
      const { cveID, publishedDate, lastModifiedDate, page, limit } = req.params;
      let query = {};
  
      if (cveID !== 'null') {
        query['cve.id'] = { $regex: new RegExp(cveID, 'i') };
      }
      if (publishedDate !== 'null') {
        query['cve.published'] = { $eq: new Date(publishedDate) };
      }
      if (lastModifiedDate !== 'null') {
        query['cve.lastModified'] = { $eq: new Date(lastModifiedDate) };
      }
  
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      const [filteredCVEs, totalCount] = await Promise.all([
        User.find(query, { _id: 0, 'cve.id': 1, 'cve.sourceIdentifier': 1, 'cve.published': 1, 'cve.lastModified': 1, 'cve.vulnStatus': 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);
  
      res.json({ cves: filteredCVEs, totalCount });
    } catch (error) {
      console.error('Error retrieving filtered and paginated CVEs:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// -------------------------------------------------------------------------------------------------------------------------------------------------------- //

fetchDataFromAPI();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
