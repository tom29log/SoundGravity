const https = require('https');

// Key from .env.local (Step 904)
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJkY2FhMzdhMWYyYWE2NjBlMDY0YWY1OThiYjQwNWZlNGE1Y2E0MzYyMmJhMmZkODA1ODkyNzY1NWZjNmQyZjRiOWRjYTY3NjUzMzQ1NzRhYyIsImlhdCI6MTc3MDA0MTQ4My44MTc3NjYsIm5iZiI6MTc3MDA0MTQ4My44MTc3NjgsImV4cCI6MTc4NTYyODgwMC4wNDI5OTQsInN1YiI6IjY0MDQ2NDAiLCJzY29wZXMiOltdfQ.K5oj2XH2dTPq2hniiJbRm9Cxom77RMbTAh-ozBgROg9lA3l8h0tePIVswtyycUYNoPKM5X_ci-FF-5SSw5O5d8n5NALeD6cSKKGIwu98urb3Sm_meBpa457-xnQvWLOtHAIdQnt-aeiKWY3HQQZ44wV6nPlxdjlVWzQXL1HnJc3tBR5nZ31kIvOwm9ZoG7H0aTBwF1RbDAly0rtT9ipBtLJah6ihX2YsPje7rQWNqn3SBgEELXeg0BZVC4fJc9wRoyQPiQX15JrhRAB0UioC5wd8LT1XIMSGMgGC0Y0fFSabtK46aMCoAeNODUox7PeySQhx6v__YpR1W9n96xhvTmKX8dMy5qHvynCOaGUJqGh_TlSXsEy8gkzPAV-xyyH8NrNlhg6akqQEqCz_slrep7DzJGEqFX6ZzJdkOcY0sKmwrsAjF7XrBETs_LEu_4R9e9-rzSdLvcqojBLZOC4P3WVVDxpjdATyV2UcQnbn-Sj8W_QExpckc9Ls1HhaWo_C_-el7Lu4EZ2oMNVfnzl04P2iWIcwGeB8tb7dfe5XylGg-57jKzrGqZN9hycmBaR6luHh9RRwKuz_G8Q-HR3UclFIeLfrdwNp7-wbOejUIUIxhUZA-HXLz3mIMpf3eVzAUDTeSD9kZvglprEgmokQh3iY0cB_r3-3ldg6jEdh6A';
const storeId = '279541';
const productId = '1270307';

console.log('Testing Checkout Creation...');
console.log('Key Length:', apiKey.length);

const payload = JSON.stringify({
    data: {
        type: 'checkouts',
        attributes: {
            checkout_data: {
                custom: { user_id: 'test_user_123' }
            },
            product_options: {
                redirect_url: 'http://localhost:3000/admin?success=true',
            }
        },
        relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: productId } }
        }
    }
});

const options = {
    hostname: 'api.lemonsqueezy.com',
    path: '/v1/checkouts',
    method: 'POST',
    headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': payload.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Checkout Created Successfully!');
            // console.log(JSON.parse(data));
        } else {
            console.log('❌ Failed:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(payload);
req.end();
