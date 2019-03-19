/* tslint:disable:no-unused-expression */
/* tslint:disable:chai-vague-errors */
import { expect } from 'chai';
import * as nock from 'nock';
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

describe('Coordinator::Rollback', () => {
    describe('Saga Commit => Rollback', () => {
        describe('2 sync + 2 async => 1 async rejects, rollback success', () => {
            before((done) => {
                nock.cleanAll();
                nock.disableNetConnect();

                // POST MOCKS
                nock('https://api.com')
                    .post('/users')
                    .reply(200, {
                        id: 482838,
                        name: 'Bruno'
                    });

                nock('https://api.com')
                    .post('/orders')
                    .reply(200, {
                        id: 344324,
                        userId: 482838,
                        total: 100.00,
                        items: [
                            {
                                name: 'abc',
                                price: 50.00
                            },
                            {
                                name: 'def',
                                price: 50.00
                            }
                        ]
                    });

                nock('https://api.com')
                    .post('/payments')
                    .delay(100)
                    .replyWithError({'message': 'Internal Server Error', 'code': 'INTERNAL_ERROR'});

                nock('https://api.com')
                    .post('/shipping')
                    .delay(500)
                    .reply(200, {
                        id: 968283,
                        total: 15.00,
                        orderId: 344324
                    });

                // DELETE MOCKS
                nock('https://api.com')
                    .delete('/users/482838')
                    .reply(200, { message: 'User successfully deleted.' });
                nock('https://api.com')
                    .delete('/orders/344324')
                    .reply(200, { message: 'Order successfully deleted.' });
                nock('https://api.com')
                    .delete('/shipping/968283')
                    .reply(200, { message: 'Shipping successfully deleted.' });

                done();
            });

            it('Should rollback 3 transactions after 1 async failure - all rollbacks succeed', async () => {
                const saga = new Coordinator();

                // All synchronous transactions need this try catch
                const userPayload = {
                    name: 'Bruno'
                };
                const user: any = await saga.add(new Transaction({
                    name: 'createUserTransaction',
                    action: () => createUser(userPayload),
                    rollback: (intendedId: number) => deleteUser(intendedId),
                    identifier: 'id',
                    async: false
                }));

                const orderPayload = {
                    total: 100.00,
                    userId: user.id,
                    items: [
                        {
                            name: 'abc',
                            price: 50.00
                        },
                        {
                            name: 'def',
                            price: 50.00
                        }
                    ]
                };
                const order: any = await saga.add(new Transaction({
                    name: 'createOrderTransaction',
                    action: () => createOrder(orderPayload),
                    rollback: (intendedId: number) => deleteOrder(intendedId),
                    identifier: 'id',
                    async: false
                }));

                const paymentPayload = {
                    reference: '123ABD999F2GF',
                    total: 100.00,
                    orderId: order.id
                };
                saga.add(new Transaction({
                    name: 'createPaymentTransaction',
                    action: () => createPayment(paymentPayload),
                    rollback: (intendedId: number) => deletePayment(intendedId),
                    identifier: 'id',
                    async: true
                }));

                const shippingPayload = {
                    total: 15.00,
                    orderId: order.id
                };
                saga.add(new Transaction({
                    name: 'createShippingTransaction',
                    action: () => createShipping(shippingPayload),
                    rollback: (intendedId: number) => deleteShipping(intendedId),
                    identifier: 'id',
                    async: true
                }));

                try {
                    await saga.commit();
                } catch (errors) {
                    // Assert single transaction failure
                    expect(errors[0].name).to.equal('createPaymentTransaction');
                    expect(errors[0].errors.action).to.deep.equal({
                        message: 'Internal Server Error',
                        code: 'INTERNAL_ERROR'
                    });
                    expect(errors[0].responses.rollback).to.be.null;

                    // Assert successfull transactions
                    const transactions: Transaction[] = await saga.rollback();

                    // Transaction #1
                    expect(transactions[0].name).to.equal('createUserTransaction');
                    expect(transactions[0].responses.action).to.deep.equal({
                        id: 482838,
                        name: 'Bruno'
                    });
                    expect(transactions[0].responses.rollback).to.deep.equal({
                        message: 'User successfully deleted.'
                    });

                    // Transaction #2
                    expect(transactions[1].name).to.equal('createOrderTransaction');
                    expect(transactions[1].responses.action).to.deep.equal({
                        id: 344324,
                        userId: 482838,
                        total: 100.00,
                        items: [
                            {
                                name: 'abc',
                                price: 50.00
                            },
                            {
                                name: 'def',
                                price: 50.00
                            }
                        ]
                    });
                    expect(transactions[1].responses.rollback).to.deep.equal({
                        message: 'Order successfully deleted.'
                    });

                    // Transaction #4
                    expect(transactions[3].name).to.equal('createShippingTransaction');
                    expect(transactions[3].responses.action).to.deep.equal({
                        id: 968283,
                        total: 15.00,
                        orderId: 344324
                    });
                    expect(transactions[3].responses.rollback).to.deep.equal({
                        message: 'Shipping successfully deleted.'
                    });
                }
            });
        });
        describe('2 sync + 2 async => 1 async rejects, rollback failure', () => {
            before((done) => {
                nock.cleanAll();
                nock.disableNetConnect();

                // POST MOCKS
                nock('https://api.com')
                    .post('/users')
                    .reply(200, {
                        id: 482838,
                        name: 'Bruno'
                    });

                nock('https://api.com')
                    .post('/orders')
                    .reply(200, {
                        id: 344324,
                        userId: 482838,
                        total: 100.00,
                        items: [
                            {
                                name: 'abc',
                                price: 50.00
                            },
                            {
                                name: 'def',
                                price: 50.00
                            }
                        ]
                    });

                nock('https://api.com')
                    .post('/payments')
                    .delay(100)
                    .replyWithError({'message': 'Internal Server Error', 'code': 'INTERNAL_ERROR'});

                nock('https://api.com')
                    .post('/shipping')
                    .delay(500)
                    .reply(200, {
                        id: 968283,
                        total: 15.00,
                        orderId: 344324
                    });

                // DELETE MOCKS
                nock('https://api.com')
                    .delete('/users/482838')
                    .replyWithError({'message': 'Internal Server Error', 'code': 'INTERNAL_ERROR'});
                nock('https://api.com')
                    .delete('/orders/344324')
                    .reply(200, { message: 'Order successfully deleted.' });
                nock('https://api.com')
                    .delete('/shipping/968283')
                    .reply(200, { message: 'Shipping successfully deleted.' });
                done();
            });

            it('Should rollback 3 transactions after 1 async failure - 1 rollback fails', async () => {
                const saga = new Coordinator();

                // All synchronous transactions need this try catch
                const userPayload = {
                    name: 'Bruno'
                };
                const user: any = await saga.add(new Transaction({
                    name: 'createUserTransaction',
                    action: () => createUser(userPayload),
                    rollback: (intendedId: number) => deleteUser(intendedId),
                    identifier: 'id',
                    async: false
                }));

                const orderPayload = {
                    total: 100.00,
                    userId: user.id,
                    items: [
                        {
                            name: 'abc',
                            price: 50.00
                        },
                        {
                            name: 'def',
                            price: 50.00
                        }
                    ]
                };
                const order: any = await saga.add(new Transaction({
                    name: 'createOrderTransaction',
                    action: () => createOrder(orderPayload),
                    rollback: (intendedId: number) => deleteOrder(intendedId),
                    identifier: 'id',
                    async: false
                }));

                const paymentPayload = {
                    reference: '123ABD999F2GF',
                    total: 100.00,
                    orderId: order.id
                };
                saga.add(new Transaction({
                    name: 'createPaymentTransaction',
                    action: () => createPayment(paymentPayload),
                    rollback: (intendedId: number) => deletePayment(intendedId),
                    identifier: 'id',
                    async: true
                }));

                const shippingPayload = {
                    total: 15.00,
                    orderId: order.id
                };
                saga.add(new Transaction({
                    name: 'createShippingTransaction',
                    action: () => createShipping(shippingPayload),
                    rollback: (intendedId: number) => deleteShipping(intendedId),
                    identifier: 'id',
                    async: true
                }));

                try {
                    await saga.commit();
                } catch (errors) {
                    // Assert single transaction failure
                    expect(errors[0].name).to.equal('createPaymentTransaction');
                    expect(errors[0].errors.action).to.deep.equal({
                        message: 'Internal Server Error',
                        code: 'INTERNAL_ERROR'
                    });
                    expect(errors[0].responses.rollback).to.be.null;

                    try {
                        await saga.rollback();
                    } catch (errors) {
                        expect(errors.length).to.equal(1);
                        // Assert single transaction failure
                        expect(errors[0].name).to.equal('createUserTransaction');
                        expect(errors[0].errors.rollback).to.deep.equal({
                            message: 'Internal Server Error',
                            code: 'INTERNAL_ERROR'
                        });
                        expect(errors[0].responses.rollback).to.be.null;
                    }
                }
            });
        });
    });

});
