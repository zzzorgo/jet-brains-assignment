import data from '../../mock/data.json';

export const getMessagesSlice = (offset, size) => {
    return data.slice(offset, size + offset);
};

