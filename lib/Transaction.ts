export interface Responses {
    action: any;
    rollback: any;
}

export class Transaction {

    public name: string; // Required
    public action: (...args: any[]) => Promise<any>; // Required
    public rollback: (...args: any[]) => Promise<any>; // Required
    public responses: Responses;
    public errors: Responses;
    public async?: boolean = true;
    public identifier?: string = 'id';

    constructor(props: any) {
        // Set properties
        this.setProperties(props);
        // Initalize responses and errors
        this.initialize();
        // Validate required properties
        this.validate();
    }

    private setProperties(props: any): void {
        for (const key of Object.keys(props)) {
            if (Object.keys((<any> this))) {
                (<any> this)[key] = props[key];
            }
        }

    }

    private initialize(): void {
        this.responses = <Responses> {
            action: null,
            rollback: null
        };
        this.errors = <Responses> {
            action: null,
            rollback: null
        };
    }

    private validate(): void {
        if (!this.name) {
            throw new Error('name property is required');
        } else if (typeof this.name !== 'string') {
            throw new Error('name property must be of type "string"');
        }

        if (!this.action) {
            throw new Error('action property is required');
        } else if (typeof this.action !== 'function') {
            throw new Error('action property must be a function');
        }

        if (!this.rollback) {
            throw new Error('rollback property is required');
        } else if (typeof this.rollback !== 'function') {
            throw new Error('rollback property must be a function');
        }
    }
}
