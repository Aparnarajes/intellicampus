import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    let transporter;
    let isTest = false;

    // 1. Use SMTP from .env if it is configured
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });
    } else {
        // 2. Fallback to Ethereal Email (fake SMTP) to "make it happen" right now for testing
        isTest = true;
        console.log('\n==========================================================');
        console.log('⚠️ WARNING: REAL EMAIL NOT CONFIGURED IN .env FILE');
        console.log('Generating a temporary Ethereal test email account...');
        console.log('==========================================================\n');

        const testAccount = await nodemailer.createTestAccount();

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass  // generated ethereal password
            }
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'IntelliCampus'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL || 'noreply@intellicampus.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);

    // If using ethereal email, print out the preview URL for the user to click
    if (isTest) {
        console.log('\n✅ EMAIL INBOX SIMULATOR:');
        console.log('You can view the sent email by clicking the link below:');
        console.log(nodemailer.getTestMessageUrl(info));
        console.log('----------------------------------------------------------\n');
    }
};

export default sendEmail;
