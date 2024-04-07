const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Function to fetch and scrape data from a single page
async function scrapePage(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Select all <a> tags with class "block-wrapper-link" and get their "href" attribute
    const links = $('a.block-wrapper-link').map((_, element) => $(element).attr('href')).get();

    return links;
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function getTotalPages() {
    const lastPageUrl = 'https://awspartyrockhackathon.devpost.com/project-gallery?page=61';
    try {
      // Extract the page number from the last page URL
      const totalPages = parseInt(lastPageUrl.split('=')[1]);
      return totalPages;
    } catch (error) {
      console.log(error);
      return 0;
    }
}
  
  
// Function to scrape data from all pages
async function scrapeAllPages() {
  const totalPages = await getTotalPages();
  const baseUrl = 'https://awspartyrockhackathon.devpost.com/project-gallery?page=';

  // Array to store all links from all pages
  let allLinks = [];

  // Loop through each page and scrape data
  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = baseUrl + page;
    const links = await scrapePage(pageUrl);
    allLinks = allLinks.concat(links);
  }

  return allLinks;
}

// Function to scrape links of the specified format from HTML content
function scrapeLinks(html) {
  const $ = cheerio.load(html);
  const formattedLinks = [];

  // Select all <a> tags with specific attributes and extract their "href" attribute
  $('nav.app-links ul[data-role="software-urls"] li a').each((_, element) => {
    const link = $(element).attr('href');
    formattedLinks.push(link);
  });

  return formattedLinks;
}

// Main function to initiate scraping and save links to JSON files
async function main() {
  try {
    // Scrape links from all pages
    const allLinks = await scrapeAllPages();

    // Write all links to a JSON file
    fs.writeFile('all_links.json', JSON.stringify(allLinks, null, 2), (err) => {
      if (err) throw err;
      console.log('All links saved to all_links.json');
    });

    // Scrape links of the specified format from each link
    const allFormattedLinks = [];
    for (let i = 0; i < allLinks.length; i++) {
      const link = allLinks[i];
      console.log('Scraping links from:', link);
      const response = await axios.get(link);
      const html = response.data;
      const formattedLinks = scrapeLinks(html); // Use the scrapeLinks function here
      allFormattedLinks.push(...formattedLinks);
    }

    // Write all formatted links to a JSON file
    fs.writeFile('formatted_links.json', JSON.stringify(allFormattedLinks, null, 2), (err) => {
      if (err) throw err;
      console.log('Formatted links saved to formatted_links.json');
    });
  } catch (error) {
    console.log(error);
  }
}

main();