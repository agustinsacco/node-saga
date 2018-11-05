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

describe('Coordinator::Commit', () => {
    describe('Saga Commit => Success', () => {
        beforeEach((done) => {
            nock.cleanAll();
            nock.disableNetConnect();

            // POST MOCKS
            nock('https://api.com')
                .post('/users')
                .delay(100)
                .reply(200, {
                    id: 482838,
                    name: 'Bruno'
                });

            nock('https://api.com')
                .post('/orders')
                .delay(600)
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
                .delay(400)
                .reply(200, {
                    id: 404923,
                    reference: '123ABD999F2GF',
                    total: 100.00,
                    orderId: 344324
                });

            nock('https://api.com')
                .post('/shipping')
                .delay(50)
                .reply(200, {
                    id: 968283,
                    total: 15.00,
                    orderId: 344324
                });

            done();
        });
        it('4 sync + 0 async => all resolve', async () => {
            const saga = new Coordinator();

            const userPayload = {
                name: 'Bruno'
            };
            const user: any = await saga.add(new Transaction({
                name: 'createUserTransaction',
                action: () => createUser(userPayload),
                rollback: intendedId => deleteUser(intendedId),
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
                rollback: intendedId => deleteOrder(intendedId),
                identifier: 'id',
                async: false
            }));

            const paymentPayload = {
                orderId: order.id,
                reference: '123ABD999F2GF',
                total: 100.00,
            };
            await saga.add(new Transaction({
                name: 'createPaymentTransaction',
                action: () => createPayment(paymentPayload),
                rollback: intendedId => deletePayment(intendedId),
                identifier: 'id',
                async: false
            }));

            const shippingPayload = {
                total: 15.00,
                orderId: order.id
            };
            await saga.add(new Transaction({
                name: 'createShippingTransaction',
                action: () => createShipping(shippingPayload),
                rollback: intendedId => deleteShipping(intendedId),
                identifier: 'id',
                async: false
            }));

            const transactions: Transaction[] = await saga.commit();

            // Transaction #1
            expect(transactions[0].name).to.be.string;
            expect(transactions[0].name).to.equal('createUserTransaction');
            expect(transactions[0].action).to.instanceof(Function);
            expect(transactions[0].rollback).to.instanceof(Function);
            expect(transactions[0].identifier).to.equal('id');
            expect(transactions[0].async).to.be.false;
            expect(transactions[0].responses.action).to.deep.equal(
                {
                    id: 482838,
                    name: 'Bruno'
                });

            // Transaction #2
            expect(transactions[1].name).to.be.string;
            expect(transactions[1].name).to.equal('createOrderTransaction');
            expect(transactions[1].action).to.instanceof(Function);
            expect(transactions[1].rollback).to.instanceof(Function);
            expect(transactions[1].identifier).to.equal('id');
            expect(transactions[1].async).to.be.false;
            expect(transactions[1].responses.action).to.deep.equal(
                {
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

            // Transaction #3
            expect(transactions[2].name).to.be.string;
            expect(transactions[2].name).to.equal('createPaymentTransaction');
            expect(transactions[2].action).to.instanceof(Function);
            expect(transactions[2].rollback).to.instanceof(Function);
            expect(transactions[2].identifier).to.equal('id');
            expect(transactions[2].async).to.be.false;
            expect(transactions[2].responses.action).to.deep.equal(
                {
                    id: 404923,
                    reference: '123ABD999F2GF',
                    total: 100.00,
                    orderId: 344324
                });

            // Transaction #4
            expect(transactions[3].name).to.be.string;
            expect(transactions[3].name).to.equal('createShippingTransaction');
            expect(transactions[3].action).to.instanceof(Function);
            expect(transactions[3].rollback).to.instanceof(Function);
            expect(transactions[3].identifier).to.equal('id');
            expect(transactions[3].async).to.be.false;
            expect(transactions[3].responses.action).to.deep.equal({
                id: 968283,
                total: 15.00,
                orderId: 344324
            });

        });
        it('2 sync + 2 async => all resolve', async () => {
            const saga = new Coordinator();

            const userPayload = {
                name: 'Bruno'
            };
            const user: any = await saga.add(new Transaction({
                name: 'createUserTransaction',
                action: () => createUser(userPayload),
                rollback: intendedId => deleteUser(intendedId),
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
                rollback: intendedId => deleteOrder(intendedId),
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
                rollback: intendedId => deletePayment(intendedId),
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
                rollback: intendedId => deleteShipping(intendedId),
                identifier: 'id',
                async: true
            }));

            const transactions: Transaction[] = await saga.commit();

            // Transaction #1
            expect(transactions[0].name).to.be.string;
            expect(transactions[0].name).to.equal('createUserTransaction');
            expect(transactions[0].action).to.instanceof(Function);
            expect(transactions[0].rollback).to.instanceof(Function);
            expect(transactions[0].identifier).to.equal('id');
            expect(transactions[0].async).to.be.false;
            expect(transactions[0].responses.action).to.deep.equal(
                {
                    id: 482838,
                    name: 'Bruno'
                });

            // Transaction #2
            expect(transactions[1].name).to.be.string;
            expect(transactions[1].name).to.equal('createOrderTransaction');
            expect(transactions[1].action).to.instanceof(Function);
            expect(transactions[1].rollback).to.instanceof(Function);
            expect(transactions[1].identifier).to.equal('id');
            expect(transactions[1].async).to.be.false;
            expect(transactions[1].responses.action).to.deep.equal(
                {
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

            // Transaction #3
            expect(transactions[2].name).to.be.string;
            expect(transactions[2].name).to.equal('createPaymentTransaction');
            expect(transactions[2].action).to.instanceof(Function);
            expect(transactions[2].rollback).to.instanceof(Function);
            expect(transactions[2].identifier).to.equal('id');
            expect(transactions[2].async).to.be.true;
            expect(transactions[2].responses.action).to.deep.equal(
                {
                    id: 404923,
                    reference: '123ABD999F2GF',
                    total: 100.00,
                    orderId: 344324
                });

            // Transaction #4
            expect(transactions[3].name).to.be.string;
            expect(transactions[3].name).to.equal('createShippingTransaction');
            expect(transactions[3].action).to.instanceof(Function);
            expect(transactions[3].rollback).to.instanceof(Function);
            expect(transactions[3].identifier).to.equal('id');
            expect(transactions[3].async).to.be.true;
            expect(transactions[3].responses.action).to.deep.equal(
                {
                    id: 968283,
                    total: 15.00,
                    orderId: 344324
                });

        });
        it('0 sync + 4 async => all resolve', async () => {
            const saga = new Coordinator();

            const userPayload = {
                name: 'Bruno'
            };
            saga.add(new Transaction({
                name: 'createUserTransaction',
                action: () => createUser(userPayload),
                rollback: intendedId => deleteUser(intendedId),
                identifier: 'id',
                async: true
            }));

            const orderPayload = {
                total: 100.00,
                userId: 482838,
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
            saga.add(new Transaction({
                name: 'createOrderTransaction',
                action: () => createOrder(orderPayload),
                rollback: intendedId => deleteOrder(intendedId),
                identifier: 'id',
                async: true
            }));

            const paymentPayload = {
                reference: '123ABD999F2GF',
                total: 100.00,
                orderId: 344324
            };
            saga.add(new Transaction({
                name: 'createPaymentTransaction',
                action: () => createPayment(paymentPayload),
                rollback: intendedId => deletePayment(intendedId),
                identifier: 'id',
                async: true
            }));

            const shippingPayload = {
                total: 15.00,
                orderId: 344324
            };
            saga.add(new Transaction({
                name: 'createShippingTransaction',
                action: () => createShipping(shippingPayload),
                rollback: intendedId => deleteShipping(intendedId),
                identifier: 'id',
                async: true
            }));

            const transactions: Transaction[] = await saga.commit();

            // Transaction #1
            expect(transactions[0].name).to.be.string;
            expect(transactions[0].name).to.equal('createUserTransaction');
            expect(transactions[0].action).to.instanceof(Function);
            expect(transactions[0].rollback).to.instanceof(Function);
            expect(transactions[0].identifier).to.equal('id');
            expect(transactions[0].async).to.be.true;
            expect(transactions[0].responses.action).to.deep.equal(
                {
                    id: 482838,
                    name: 'Bruno'
                });

            // Transaction #2
            expect(transactions[1].name).to.be.string;
            expect(transactions[1].name).to.equal('createOrderTransaction');
            expect(transactions[1].action).to.instanceof(Function);
            expect(transactions[1].rollback).to.instanceof(Function);
            expect(transactions[1].identifier).to.equal('id');
            expect(transactions[1].async).to.be.true;
            expect(transactions[1].responses.action).to.deep.equal(
                {
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

            // Transaction #3
            expect(transactions[2].name).to.be.string;
            expect(transactions[2].name).to.equal('createPaymentTransaction');
            expect(transactions[2].action).to.instanceof(Function);
            expect(transactions[2].rollback).to.instanceof(Function);
            expect(transactions[2].identifier).to.equal('id');
            expect(transactions[2].async).to.be.true;
            expect(transactions[2].responses.action).to.deep.equal(
                {
                    id: 404923,
                    reference: '123ABD999F2GF',
                    total: 100.00,
                    orderId: 344324
                });

            // Transaction #4
            expect(transactions[3].name).to.be.string;
            expect(transactions[3].name).to.equal('createShippingTransaction');
            expect(transactions[3].action).to.instanceof(Function);
            expect(transactions[3].rollback).to.instanceof(Function);
            expect(transactions[3].identifier).to.equal('id');
            expect(transactions[3].async).to.be.true;
            expect(transactions[3].responses.action).to.deep.equal(
                {
                    id: 968283,
                    total: 15.00,
                    orderId: 344324
                });
        });
    });

    describe('Saga Commit => Failure', () => {
        describe('2 sync + 2 async => 1 async rejects', () => {
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

                done();
            });

            it('Should assert 1 asynchronous transaction failure', async () => {
                const saga = new Coordinator();

                // All synchronous transactions need this try catch
                const userPayload = {
                    name: 'Bruno'
                };
                const user: any = await saga.add(new Transaction({
                    name: 'createUserTransaction',
                    action: () => createUser(userPayload),
                    rollback: intendedId => deleteUser(intendedId),
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
                    rollback: intendedId => deleteOrder(intendedId),
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
                    rollback: intendedId => deletePayment(intendedId),
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
                    rollback: intendedId => deleteShipping(intendedId),
                    identifier: 'id',
                    async: true
                }));

                try {
                    await saga.commit();
                } catch (errors) {
                    expect(errors[0].name).to.be.string;
                    expect(errors[0].name).to.equal('createPaymentTransaction');
                    expect(errors[0].action).to.be.null;
                    expect(errors[0].rollback).to.be.null;
                    expect(errors[0].identifier).to.equal('id');
                    expect(errors[0].async).to.be.true;
                    expect(errors[0].errors.action).to.deep.equal(
                        {
                            message: 'Internal Server Error',
                            code: 'INTERNAL_ERROR'
                        });
                    }
            });
        });
        describe('2 sync + 2 async => 2 async reject', () => {
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
                    .replyWithError({'message': 'Internal Server Error', 'code': 'INTERNAL_ERROR'});

                done();
            });

            it('Should assert 2 asynchronous transaction failure', async () => {
                const saga = new Coordinator();

                // All synchronous transactions need this try catch
                const userPayload = {
                    name: 'Bruno'
                };
                const user: any = await saga.add(new Transaction({
                    name: 'createUserTransaction',
                    action: () => createUser(userPayload),
                    rollback: intendedId => deleteUser(intendedId),
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
                    rollback: intendedId => deleteOrder(intendedId),
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
                    rollback: intendedId => deletePayment(intendedId),
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
                    rollback: intendedId => deleteShipping(intendedId),
                    identifier: 'id',
                    async: true
                }));

                try {
                    await saga.commit();
                } catch (errors) {
                    expect(errors[0].name).to.be.string;
                    expect(errors[0].name).to.equal('createPaymentTransaction');
                    expect(errors[0].action).to.be.null;
                    expect(errors[0].rollback).to.be.null;
                    expect(errors[0].identifier).to.equal('id');
                    expect(errors[0].async).to.be.true;
                    expect(errors[0].errors.action).to.deep.equal(
                        {
                            message: 'Internal Server Error',
                            code: 'INTERNAL_ERROR'
                        });

                    expect(errors[1].name).to.be.string;
                    expect(errors[1].name).to.equal('createShippingTransaction');
                    expect(errors[1].action).to.be.null;
                    expect(errors[1].rollback).to.be.null;
                    expect(errors[1].identifier).to.equal('id');
                    expect(errors[1].async).to.be.true;
                    expect(errors[1].errors.action).to.deep.equal(
                        {
                            message: 'Internal Server Error',
                            code: 'INTERNAL_ERROR'
                        });
                }
            });
        });
    });

    describe('Saga Create => Failure', () => {
        describe('2 sync + 2 async => 1 sync rejects', () => {
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
                    .delay(200)
                    .replyWithError({'message': 'Internal Server Error', 'code': 'INTERNAL_ERROR'});

                nock('https://api.com')
                    .post('/payments')
                    .delay(400)
                    .reply(200, {
                        id: 404923,
                        reference: '123ABD999F2GF',
                        total: 100.00,
                        orderId: 344324
                    });

                nock('https://api.com')
                    .post('/shipping')
                    .delay(500)
                    .reply(200, {
                        id: 968283,
                        total: 15.00,
                        orderId: 344324
                    });

                done();
            });

            it('Error attributes should match async transaction', async () => {
                const saga = new Coordinator();

                // All synchronous transactions need this try catch
                try {
                    const userPayload = {
                        name: 'Bruno'
                    };
                    const user: any = await saga.add(new Transaction({
                        name: 'createUserTransaction',
                        action: () => createUser(userPayload),
                        rollback: intendedId => deleteUser(intendedId),
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
                        rollback: intendedId => deleteOrder(intendedId),
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
                        rollback: intendedId => deletePayment(intendedId),
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
                        rollback: intendedId => deleteShipping(intendedId),
                        identifier: 'id',
                        async: true
                    }));
                } catch (errors) {
                    expect(errors.name).to.be.string;
                    expect(errors.name).to.equal('createOrderTransaction');
                    expect(errors.action).to.be.null;
                    expect(errors.rollback).to.be.null;
                    expect(errors.identifier).to.equal('id');
                    expect(errors.async).to.be.false;
                    expect(errors.errors.action).to.deep.equal(
                        {
                            message: 'Internal Server Error',
                            code: 'INTERNAL_ERROR'
                        });
                }
            });
        });
    });

});
