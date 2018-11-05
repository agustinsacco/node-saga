/* tslint:disable:no-unused-expression */
/* tslint:disable:chai-vague-errors */

import { expect } from 'chai';
import {
    createPayment,
    deletePayment,
    createShipping,
    deleteShipping,
    createOrder,
    deleteOrder,
    createUser,
    deleteUser
 } from './helpers/GenericRequest';
import { Coordinator } from '../lib/Coordinator';
import { Transaction } from '../lib/Transaction';

describe('Coordinator', () => {
    describe('Get Transactions', () => {
        it('Should return empty array of transactions', async () => {
            const saga = new Coordinator();
            expect(saga.getTransactions()).to.be.empty;
        });
        it('Should return an array with 1 transaction', async () => {
            const saga = new Coordinator();
            saga.add(new Transaction({
                name: 'test',
                action: () => () => { return null; },
                rollback: intendedId => (intendedId) => { return null; },
                identifier: 'id',
            }));

            const tx = saga.getTransactions();
            expect(tx.length).to.be.equal(1);

            expect(tx[0].name).to.be.string;
            expect(tx[0].name).to.equal('test');
            expect(tx[0].action).to.instanceof(Function);
            expect(tx[0].rollback).to.instanceof(Function);
            expect(tx[0].identifier).to.equal('id');
            expect(tx[0].async).to.be.true;
        });
    });
});
