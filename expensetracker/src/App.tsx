import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

"use client"

Amplify.configure(outputs); 

const client = generateClient<Schema>({
  authMode:"userPool",
}); 

type Expense = {
  name: string | null;
  amount: number | null;
  readonly id: string;
  owner: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */
export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  

  useEffect(() => {
    const subscription = client.models.Expense.observeQuery().subscribe({
      next: (data) => setExpenses(data.items),
      error: (err) => console.error("Subscription error:", err),
    });

    return () => subscription.unsubscribe();
    }, []);

  async function createExpense(event:any) {
    event.preventDefault();
    const form = new FormData(event.target);

    const nameEntry = form.get("name"); 
    const amountEntry = form.get("amount");

    await client.models.Expense.create({
      name: typeof nameEntry === "string" ? nameEntry: null,
      amount: typeof amountEntry === "string" ? parseFloat(amountEntry): null,
    });
    event.target?.reset();
    await fetchExpense(); 
  }

  async function deleteExpense(id: string) {
    const toBeDeletedExpense = {id};
    await client.models.Expense.delete(toBeDeletedExpense);
    await fetchExpense(); 
  }

  async function fetchExpense(){
    const results = await client.models.Expense.list(); 
    setExpenses(results.data); 
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex
          className="App"
          justifyContent="center"
          alignItems="center"
          direction="column"
          width="70%"
          margin="0 auto"
        >
          <Heading level={1}>Expense Tracker</Heading>
          <View as="form" margin="3rem 0" onSubmit={createExpense}>
            <Flex
              direction="column"
              justifyContent="center"
              gap="2rem"
              padding="2rem"
            >
              <TextField
                name="name"
                placeholder="Expense Name"
                label="Expense Name"
                labelHidden
                variation="quiet"
                required
              />
              <TextField
                name="amount"
                placeholder="Expense Amount"
                label="Expense Amount"
                type="float"
                labelHidden
                variation="quiet"
                required
              />
              <Button type="submit" variation="primary">
                Create Expense
              </Button>
            </Flex>
          </View>
          <Divider />
          <Heading level={2}>Expenses</Heading>
          <Grid
            margin="3rem 0"
            autoFlow="column"
            justifyContent="center"
            gap="2rem"
            alignContent="center"
          >
            {expenses.map((expense) => (
              <Flex
                key={expense.id || expense.name}
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="2rem"
                border="1px solid #ccc"
                padding="2rem"
                borderRadius="5%"
                className="box"
              >
                <View>
                  <Heading level={3}>{expense.name}</Heading>
                </View>
                <Text fontStyle="italic">${expense.amount}</Text>
                <Button
                  variation="destructive"
                  onClick={() => deleteExpense(expense.id)}
                >
                  Delete note
                </Button>
              </Flex>
            ))}
          </Grid>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}