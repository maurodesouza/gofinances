import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface RequestDTO {
  csvFilename: string;
}

interface TransactionCsvFormat {
  title: string;
  type: string;
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: RequestDTO): Promise<void> {
    const csvFilePath = path.join(uploadConfig.directory, csvFilename);
    const readCsvStrem = fs.createReadStream(csvFilePath);

    const parseStrem = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCsv = readCsvStrem.pipe(parseStrem);

    const transactionsCsv: TransactionCsvFormat[] = [];

    parseCsv.on('data', (line: string[]) => {
      const [title, type, value, category] = line.map(item => item.trim());

      if (!title || !type || !value) return;

      const newTransaction = {
        title,
        type,
        value: Number(value),
        category,
      };

      transactionsCsv.push(newTransaction);
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });

    const incomeTransactionsCsv = transactionsCsv.filter(
      transaction => transaction.type === 'income',
    );

    const outcomeTransactionsCsv = transactionsCsv.filter(
      transaction => transaction.type === 'outcome',
    );

    await Promise.all(incomeTransactionsCsv.map(this.createTransaction));

    await Promise.all(outcomeTransactionsCsv.map(this.createTransaction));

    await fs.promises.unlink(csvFilePath);
  }

  private async createTransaction(
    transaction: TransactionCsvFormat,
  ): Promise<void> {
    const createTransaction = new CreateTransactionService();

    await createTransaction.execute({
      title: transaction.title,
      type: transaction.type as Transaction['type'],
      value: transaction.value,
      category: transaction.category,
    });
  }
}

export default ImportTransactionsService;
