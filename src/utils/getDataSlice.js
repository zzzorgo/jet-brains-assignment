import data from '../../mock/data.json';

export const getDataSlice = (offset, size) => {
    return data.slice(offset, size + offset);
};

