import { Transaction } from './Transaction';

export class Coordinator {

    /**
     * Transaction list
     */
    private transactions: Transaction[] = [];
    private commited: boolean = false;

    /**
     * Creates a new transaction.
     *
     * - If transaction is labeled as synchronous, it will
     * execute the action Function right away and return a
     * promise that should be awaited.
     *
     * - If transaction is not labeled as asynchronous, the
     * action will not be executed.
     *
     * TODO: add validation to passed object (must be transaction). Only transactions
     * can be passed and all validation must pass.
     *
     * @param transaction
     */
    public async add(transaction: Transaction): Promise<Transaction> {
        // TODO add validation to transaction object. Only transactions can be passed and all
        // validation must pass.
        return new Promise<Transaction>((resolve, reject) => {
            // Check if the current transaction is synchronous
            if (!transaction.async) {
                return transaction.action()
                    .then((response) => {
                        transaction.responses.action = response;
                        return resolve(transaction);
                    })
                    .catch((error) => {
                        // Set action response to null;
                        transaction.responses.action = null;
                        transaction.errors.action = error;
                        // Remove action and rollback. The transaction has thrown
                        // an error and it is now read-only
                        transaction.action = null;
                        transaction.rollback = null;
                        return reject(transaction);
                    })
                    .finally(() => {
                        this.transactions.push(transaction);
                    });
            }
            this.transactions.push(transaction);
            return resolve(transaction);
        });
    }

    /**
     * Commits all asynchronous transactions
     *
     * TODO: Test that an already commited saga does not get
     * run again.
     * TODO: If not transactions have been added, throw an error that
     * we cannot commit without any transactions.
     */
    public commit(): Promise<Transaction[]> {
        return new Promise<Transaction[]>((resolve, reject) => {
            // Check if transactions have already been commited.
            if (this.commited === true) {
                return reject(new Error('Saga has already been commited.'));
            }
            this.commited = true;

            let resultCount: number = 0;
            const asyncTx: Transaction[] = this.filter((tx: Transaction) => {
                return tx.async === true;
            });

            if (!asyncTx.length) {
                return resolve(this.transactions);
            }

            for (let t = 0; t < asyncTx.length; t++) {
                asyncTx[t].action()
                    .then((value) => {
                        asyncTx[t].responses.action = value;
                    })
                    .catch((error) => {
                        // Set action response to null;
                        asyncTx[t].responses.action = null;
                        asyncTx[t].errors.action = error;
                        // Remove action and rollback. The transaction has thrown
                        // an error and it is now read-only
                        asyncTx[t].action = null;
                        asyncTx[t].rollback = null;
                    })
                    .finally(() => {
                        resultCount++;
                        if (resultCount === asyncTx.length) {
                            const rejected: Transaction[] = this.filter((tx: Transaction) => {
                                return tx.errors.action !== null && tx.responses.action === null;
                            });

                            if (rejected.length > 0) {
                                return reject(rejected);
                            }

                            return resolve(this.transactions);
                        }
                    });
            }
        });
    }

    /**
     * Rolls back all successful transactions if at
     * least 1 transaction was rejected.
     *
     * TODO: Cannot rollback if we have not already commited.
     * TODO: Add check to only rollback once.
     */
    public rollback(): Promise<Transaction[]> {
        return new Promise<Transaction[]>((resolve, reject) => {
            let resultCount: number = 0;

            const successTx: Transaction[] = this.filter((tx: Transaction) => {
                return tx.responses.action !== null && tx.errors.action === null;
            });

            for (let t = 0; t < successTx.length; t++) {
                successTx[t].rollback(successTx[t].responses.action[successTx[t].identifier])
                    .then((value) => {
                        successTx[t].responses.rollback = value;
                        resultCount++;
                    })
                    .catch((error) => {
                        successTx[t].responses.rollback = null; // empty response
                        successTx[t].errors.rollback = error;
                        resultCount++;
                    })
                    .finally(() => {
                        // Go through all transactions to make sure they are completed
                        if (resultCount === successTx.length) {
                            const rejectedTx: Transaction[] = this.filter((tx: Transaction) => {
                                return tx.errors.rollback !== null && tx.responses.rollback === null;
                            });
                            if (rejectedTx.length > 0) {
                                return reject(rejectedTx);
                            }
                            return resolve(this.transactions);
                        }
                    });
            }
        });
    }

    /**
     * Returns filtered array of transactions given
     * conditional callback.
     *
     * @param conditional
     */
    private filter(conditional: Function): Transaction[] {
        const tx: Transaction[] = [];
        for (let t = 0; t < this.transactions.length; t++) {
            if (conditional(this.transactions[t])) {
                tx.push(this.transactions[t]);
            }
        }
        return tx;
    }

    /**
     * Returns all transactions.
     */
    public getTransactions(): Transaction[] {
        return this.transactions;
    }
}
