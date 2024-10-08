"use server";
import { revalidatePath } from "next/cache";
import { Post, User } from "./models";
import { connectToDb } from "./utils";
import { signIn, signOut } from "./auth";
import bcrypt from "bcryptjs";

export const addPost = async (prevState, formData) => {
    console.log("form data: ", formData);
    const { title, desc, slug, userId } = Object.fromEntries(formData);

    try {
        connectToDb();
        const newPost = new Post({
            title,
            desc,
            slug,
            userId,
        });

        await newPost.save();
        console.log("saved to db");

        revalidatePath("/blog");
        revalidatePath("/admin");
    } catch (error) {
        console.error(error);
        return { error: "Something went wrong" };
    }
};

export const deletePost = async (formData) => {
    const { _id } = Object.fromEntries(formData);

    try {
        connectToDb();
        await Post.findByIdAndDelete(_id);
        console.log("deleted from db");

        revalidatePath("/blog");
        revalidatePath("/admin");
    } catch (error) {
        console.error(error);
        return { error: "Something went wrong" };
    }
};

export const addUser = async (prevState, formData) => {
    const { username, email, password, img } = Object.fromEntries(formData);

    try {
        connectToDb();
        const newUser = new User({
            username,
            email,
            password,
            img,
        });

        await newUser.save();
        console.log("saved to db");

        revalidatePath("/admin");
    } catch (error) {
        console.error(error);
        return { error: "Something went wrong" };
    }
};

export const deleteUser = async (formData) => {
    const { _id } = Object.fromEntries(formData);

    try {
        connectToDb();

        await Post.deleteMany({ userId: _id });
        await User.findByIdAndDelete(_id);
        console.log("deleted from db");

        revalidatePath("/admin");
    } catch (error) {
        console.error(error);
        return { error: "Something went wrong" };
    }
};

export const handleGithubLogin = async () => {
    "use server";
    await signIn("github");
};

export const handleLogout = async () => {
    "use server";
    await signOut();
};

export const register = async (prevState, formData) => {
    const { username, email, password, img, passwordRepeat } = Object.fromEntries(formData);

    if (password !== passwordRepeat) {
        return { error: "Passwords do not match" };
    }

    try {
        connectToDb();

        const user = await User.findOne({ username });
        if (user) {
            return { error: "Username already exists" };
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            img,
        });

        await newUser.save();
        console.log("saved to db");

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Something went wrong" };
    }
};

export const login = async (prevState, formData) => {
    const { username, password } = Object.fromEntries(formData);

    try {
        await signIn("credentials", { username, password });
    } catch (error) {
        console.log("error is: ", JSON.stringify(error));

        if (error.message.includes("CredentialsSignin")) {
            return { error: "Invalid username or password" };
        }
        throw error;
    }
};
