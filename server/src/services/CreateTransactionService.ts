import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type))
      throw new AppError(
        'Só é possível criar transação do tipo income ou outcome.',
      );

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && value > total)
      throw new AppError('Saldo insuficiente.');

    let transactionCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    const newTransaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: transactionCategory.id,
    });

    await transactionRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
