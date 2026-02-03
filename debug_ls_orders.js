const https = require('https');

// Key from .env.local (1035 chars)
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJkY2FhMzdhMWYyYWE2NjBlMDY0YWY1OThiYjQwNWZlNGE1Y2E0MzYyMmJhMmZkODA1ODkyNzY1NWZjNmQyZjRiOWRjYTY3NjUzMzQ1NzRhYyIsImlhdCI6MTc3MDA0MTQ4My44MTc3NjYsIm5iZiI6MTc3MDA0MTQ4My44MTc3NjgsImV4cCI6MTc4NTYyODgwMC4wNDI5OTQsInN1YiI6IjY0MDQ2NDAiLCJzY29wZXMiOltdfQ.K5oj2XH2dTPq2hniiJbRm9Cxom77RMbTAh-ozBgROg9lA3l8h0tePIVswtyycUYNoPKM5X_ci-FF-5SSw5O5d8n5NALeD6cSKKGIwu98urb3Sm_meBpa457-xnQvWLOtHAIdQnt-aeiKWY3HQQZ44wV6nPlxdjlVWzQXL1HnJc3tBR5nZ31kIvOwm9ZoG7H0aTBwF1RbDAly0rtT9ipBtLJah6ihX2YsPje7rQWNqn3SBgEELXeg0BZVC4fJc9wRoyQPiQXy15JrhRAB0UioC5wd8LT1XIMSGMgGC0Y0fFSabtK46aMCoAeNODUox7PeySQhx6v__YpR1W9n96xhvTmKX8dMy5qHvynCOaGUJqGh_TlSXsEy8gkzPAV-xyyH8NrNlhg6akqQEqCz_slrep7DzJGEqFX6ZzJdkOcY0sKmwrsAjF7XrBETs_LEu_4R9e9-rzSdLvcqojBLZOC4P3WVVDxpjdATyV2UcQnbn-Sj8W_QExpckc9Ls1HhaWo_C_-el7Lu4EZ2oMNVfnzl04P2iWIcwGeB8tb7dfe5XylGg-57jKzrGqZN9hycmBaR6luHh9RRwKuz_G8Q-HR3UclFIeLfrdwNp7-wbOejUIUIxhUZA-HXLz3mIMpf3eVzAUDTeSD9kZvglprEgmokQh3iY0cB_r3-3ldg6jEdh6A';

const options = {
    hostname: 'api.lemonsqueezy.com',
    path: '/v1/orders?page[size]=10',
    method: 'GET',
    headers: {
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            const json = JSON.parse(data);
            console.log('--- Recent Orders ---');
            json.data.forEach(order => {
                const attrs = order.attributes;
                const custom = attrs.test_mode ? '(TEST)' : '(LIVE)';
                console.log(`Order ${order.id} ${custom}: ${attrs.user_email}`);
                console.log(`  Customer ID: ${attrs.customer_id}`);
                console.log(`  Custom Data:`, JSON.stringify(order.meta?.custom_data || {}));
                console.log('---');
            });
        } else {
            console.log('❌ Failed:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.end();
