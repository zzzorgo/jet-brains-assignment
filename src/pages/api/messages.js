import { getDataSlice } from '@/utils/getDataSlice';

export default function handler(req, res) {
    const { offset = '0', size = '10' } = req.query;

    res.status(200).json({ data: getDataSlice(Number(offset), Number(size)) });
}
