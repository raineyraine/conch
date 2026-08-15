# Built-in types

By default, all available types for arguments in conch are under `conch.args`.

Here's the current list of available types:

| Type Name | Data Type | Type Name | Data Type     | Can implicitly cast               |
| --------- | --------- | --------- | ------------- | --------------------------------- |
| string    | `string`  | strings   | `{ string }`  | any tostringable type             |
| number    | `number`  | numbers   | `{ number }`  |                                   |
| boolean   | `boolean` | booleans  | `{ boolean }` | `number`                          |
| table     | `{}`      |           |               |                                   |
| vector    | `vector`  | vectors   | `{ vector }`  | `{ number }`,                     |
| player    | `Player`  | players   | `{ Player }`  | `string`, `@a` (all players), `@s` (yourself), player |
| userinput | `Enum.UserInputType` |   |    | `string` |
| userid | `number` | userids | `{ number }` | `Player`, `string`, `@a`, `@s`, `number` |
| duration | `number` |  | | `string`, `number` |
| color3 | `Color3` |  | | `number`, `vector` |

## Variadic Types

All types can be made variadic by using `conch.args.variadic`. Only the last argument can be made variadic.

## Enums

Conch provides `enum_from_array` and `enum_from_map` for registering enums and providing autocomplete. These functions need to be invoked on both client and server for each type. `enum_from_array` takes a list of options, while `enum_from_map` would map the keys to the values.

```luau
const potion_names = conch.args.enum_from_array("potion_names", { "health_potion", "swiftness_potion" })

const potions = conch.args.enum_from_map("potion_names", data.potions)
```

```luau
const args = require("path/to/args")

conch.register("give-potion", {
    description = "Gives a potion",
    permissions = {},
    arguments = function()
        return args.potion_names()
    end,

    callback = function(name)
        print(name)
        return name
    end
})
```

### static_enum_from_array

This allows for defining an enum purely on the server. Unlike `enum_from_array` and `enum_from_map`, `static_enum_from_array` relies on the type system provided by Conch to work, which allows it to be replicated.

## Custom types

Conch supports defining custom types as the language does not provide full support for all Roblox types. This is how types like `player` and `players` are implemented. This type system allows Conch to provide better autocomplete for functions.

### Literals

Literals are a type within conch used to store a specific value. They only match their exact value. While any value can be stored, the intent is for you to only have literals for strings, numbers and booleans.

Literals by themselves are not that useful, but rather become useless when used in conjunction with overloads or unions.

```luau
conch.register("example", {
    description = "example command",
    permissions = {},
    arguments = function()
        return conch.args.literal("hello world")
    end,

    callback = function(value)

    end
})
```

### Unions

Unions within conch defines a list of options you could select from. Autocomplete shows all given options. This is used to handle `static_enum_from_array`. While types only extend up to five arguments, you could extend this infinitely. Unions can replicate across server client boundaries aslong as the values themselves can also be replicated.

Prefer defining enums over unions for command arguments.

```luau
conch.register("union", {
    description = "example command",
    permissions = {},
    arguments = function()
        return conch.args.union( conch.args.literal("option1"), conch.args.literal("option2") )
    end,

    callback = function(option)
        return option
    end
})
```

### Overloads

Conch supports command overloading, allowing a command to support different set of arguments. It is recommended to use literals with overloads, but they are not required for making them work aslong as the type signature is different.

An overload can be defined through the following:

```luau
conch.register("give-item", {
    description = "gives an item to the player",
    permissions = {},
    arguments = function()
        return conch.args.overload({
            { conch.args.literal("potion"), custom_args.potions() },
            { conch.args.literal("food"), custom_args.food() },
        })
    end,

    callback = function(potion_or_food, name)

    end
})
```

### Strange types

To support foreign types not known to conch like `player` and `color`, conch uses so called strange types. These types are an escape hatch, providing match, exact_match, suggestions and convert functions. All strange types must be registered on both client and server to properly replicate, otherwise they may not be able to be filled out.

Below is an example of how the player type is registered.

```luau

conch.register_strange_type({
    type = "player", -- the type name shown to the user
    id = "__player_base", -- the actual internal id of the type

    -- this function is responsible for converting a string or userid into a player.
    convert = function(arg: unknown): Player
        const ctx = context.get_command_context()

        if arg == "@s" then
            return ctx and ctx.executor.player
                or error "not executed by a player"
        elseif typeof(arg) == "number" then
            local player = assert(
                Players:GetPlayerByUserId(arg),
                `player with id {arg} is not in this server`
            )
            return player
        elseif typeof(arg) == "string" then
            local player = assert(
                Players:FindFirstChild(arg) :: Player,
                `player "{arg}" is not valid`
            )
            return player
        elseif typeof(arg) == "Instance" and arg:IsA "Player" then
            return arg
        else
            error(`unknown arg {arg}`)
        end
    end,

    -- match determines loosely if an argument matches a type, which is used in analysis when determining whether to autocomplete for this type.
    match = function(arg: unknown): boolean
        if typeof(arg) == "number" then
            return true
        elseif typeof(arg) == "string" then
            return true
        elseif typeof(arg) == "Instance" and arg:IsA "Player" then
            return true
        else
            return false
        end
    end,

    -- exact_match is used when determining the correct overload to pick. it should only return true if the argument will return a valid player.
    exact_match = function(arg: unknown): boolean
        if arg == "@s" then
            return true
        elseif typeof(arg) == "number" then
            return Players:GetPlayerByUserId(arg) ~= nil
        elseif typeof(arg) == "string" then
            return Players:FindFirstChild(arg) ~= nil
        elseif typeof(arg) == "Instance" and arg:IsA "Player" then
            return true
        else
            return false
        end
    end,

    -- suggestions simply should return an array of suggestions to the user.
    suggestions = function(value): { language.Suggestion }
        local suggestions: { language.Suggestion } = {}

        table.insert(suggestions, {
            kind = nil,
            metadata = {
                name = "self",
                description = "Refers to yourself",
                type = "player",
            },
            text = "@s",
            display = "@s (self)",
        })

        for _, player in Players:GetPlayers() do
            table.insert(suggestions, {
                kind = nil,
                metadata = nil,
                text = player.Name,
                display = `{player.DisplayName} (@{player.Name})`,
            })
        end

        return suggestions
    end,

})

```
