import fs from 'fs';

const generate = () => {
    const data = Array(100000).fill(undefined);

    for (let i = 0; i < data.length; i++) {
        const bodyLength = Math.floor(Math.random() * 1000);
        let body = Array(bodyLength).fill(undefined);

        for (let index = 0; index < body.length; index++) {
            const spaceChance = Math.random() * 7;
            if (spaceChance > 6) {
                body[index] = ' ';
            } else {
                body[index] = String.fromCharCode(Math.floor(Math.random() * 26) + 97);
            }
        }

        data[i] = {
            body: body.join(''),
            id: i,
        };
    }

    fs.writeFileSync('./mock/data.json', JSON.stringify(data, null, 2));
};

generate();
