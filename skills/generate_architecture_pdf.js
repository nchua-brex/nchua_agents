#!/usr/bin/env node

/**
 * PDF Generation Script for Architecture Overview
 * Generates a professional PDF from the HTML architecture document
 */

const fs = require('fs');
const path = require('path');

async function generatePDF() {
    try {
        // Try to use puppeteer if available
        const puppeteer = require('puppeteer');

        console.log('🎯 Generating Architecture Overview PDF with Puppeteer...');

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Read the HTML file
        const htmlPath = path.join(__dirname, 'architecture_overview_brex_compliant.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Set page content
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Configure PDF options for one-page layout
        const pdfOptions = {
            path: path.join(__dirname, 'Architecture_Overview_Brex_Compliant.pdf'),
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            displayHeaderFooter: false,
            scale: 0.8, // Reduce scale to fit more content
        };

        // Generate PDF
        await page.pdf(pdfOptions);

        await browser.close();

        console.log('✅ PDF generated successfully: Architecture_Overview_Brex_Compliant.pdf');

        return path.join(__dirname, 'Architecture_Overview_Brex_Compliant.pdf');

    } catch (puppeteerError) {
        console.log('⚠️  Puppeteer not available, trying alternative method...');

        try {
            // Fallback to Chrome headless if puppeteer fails
            const { exec } = require('child_process');
            const htmlPath = path.join(__dirname, 'architecture_overview_brex_compliant.html');
            const pdfPath = path.join(__dirname, 'Architecture_Overview_Brex_Compliant.pdf');

            const chromeCommand = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --print-to-pdf="${pdfPath}" --print-to-pdf-no-header --virtual-time-budget=1000 "file://${htmlPath}"`;

            return new Promise((resolve, reject) => {
                exec(chromeCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ Chrome headless failed:', error.message);
                        console.log('\n💡 Manual PDF generation:');
                        console.log('1. Open the HTML file in your browser');
                        console.log('2. Press Ctrl+P (or Cmd+P on Mac)');
                        console.log('3. Choose "Save as PDF"');
                        console.log('4. Set margins to minimum and enable background graphics');
                        reject(error);
                        return;
                    }

                    console.log('✅ PDF generated with Chrome headless: Architecture_Overview_Brex_Compliant.pdf');
                    resolve(pdfPath);
                });
            });

        } catch (fallbackError) {
            console.error('❌ All PDF generation methods failed');
            console.log('\n💡 Manual PDF generation instructions:');
            console.log('1. Open architecture_overview_brex_compliant.html in your browser');
            console.log('2. Press Ctrl+P (or Cmd+P on Mac)');
            console.log('3. Choose "Save as PDF"');
            console.log('4. Set margins to minimum and enable background graphics');
            console.log('5. Save as "Architecture_Overview_Brex_Compliant.pdf"');

            throw fallbackError;
        }
    }
}

// Run if called directly
if (require.main === module) {
    generatePDF().then((pdfPath) => {
        if (pdfPath) {
            // Try to open the PDF
            const { exec } = require('child_process');
            exec(`open "${pdfPath}"`, (error) => {
                if (error) {
                    console.log('PDF saved successfully, but could not auto-open');
                    console.log('Please manually open:', pdfPath);
                } else {
                    console.log('🎉 PDF opened successfully!');
                }
            });
        }
    }).catch(console.error);
}

module.exports = { generatePDF };