import * as request from 'request';

export const postGenericRequest = (resource: string, payload: any) => {
    return new Promise((resolve, reject) => {
        request({
            url: `https://api.com/${resource}`,
            method: 'POST',
            json: payload
        }, (error, response, body) => {
            if (error) {
                return reject(error);
            }
            return resolve(body);
        });
    });
};
export const deleteGenericRequest = (resource: string, id: any) => {
    return new Promise((resolve, reject) => {
        request({
            url: `https://api.com/${resource}/${id}`,
            method: 'DELETE',
        }, (error, response, body) => {
            if (error) {
                return reject(error);
            }
            return resolve(JSON.parse(body));
        });
    });
};

export const createPayment = (payload: any) => {
    return postGenericRequest('payments', payload);
};

export const deletePayment = (id: any) => {
    return deleteGenericRequest('payments', id);
};

export const createShipping = (payload: any) => {
    return postGenericRequest('shipping', payload);
};

export const deleteShipping = (id: any) => {
    return deleteGenericRequest('shipping', id);
};

export const createOrder = (payload: any) => {
    return postGenericRequest('orders', payload);
};

export const deleteOrder = (id: any) => {
    return deleteGenericRequest('orders', id);
};

export const createUser = (payload: any) => {
    return postGenericRequest('users', payload);
};

export const deleteUser = (id: any) => {
    return deleteGenericRequest('users', id);
};
