local fs = require "@lune/fs"
local manifest = require "./utils/manifest"
local process = require "@lune/process"
local serde = require "@lune/serde"
type PesdeToml = manifest.PesdeManifest
type PesdeDependency = manifest.DependencySpecifier

local function reexportTypes(variable: string, src: string)
	local exports = src:gmatch "export type ([%w%.<>=_]-) = "
	local reexports = ""

	for export in exports do
	end
end

local function joinAsFile(lines: { string }) return table.concat(lines, "\n") end

local function buildPackage(pkgPath: string)
	print(`Building package {pkgPath}..`)
	local function pkg(path: string) return pkgPath .. "/" .. path end

	assert(fs.isDir(pkgPath), `{pkgPath} is not a directory!`)

	local pesdeToml = manifest(pkg "pesde.toml", {})

	local src = pkg "src"
	assert(fs.isDir(src), `{src} does not exist!`)

	local dist = pkg "dist"
	if fs.isDir(dist) then fs.removeDir(dist) end
	fs.writeDir(dist)

	fs.copy(src, dist .. "/src")

	local srcInit = pkg "src/init.luau"
	assert(fs.isFile(srcInit), `{srcInit} does not exist!`)
	local init = pkg "dist/init.luau"
	local lib = pkg "dist/lib.luau"

	--local srcInitContents = fs.readFile(srcInit)
	local libFileContents = {
		`local main = require("./src")`,
		`return main`,
	}
	local initFileContents = {
		`local main = require(script.lib)`,
		`return main`,
	}

	fs.writeFile(init, joinAsFile(initFileContents))
	fs.writeFile(lib, joinAsFile(libFileContents))

	local robloxPackagesDir = pkg "dist/roblox_packages"
	fs.writeDir(robloxPackagesDir)

	local dependencies = pesdeToml.dependencies
	local packageFiles: { [string]: string } = {}
	if dependencies then
		for name, dependency in dependencies :: any do
			local realm = dependency.target or pesdeToml.target.environment
			if realm ~= "roblox" then continue end
			local target = dependency.workspace or dependency.wally
			assert(target, "could not get dependency target")

			local split = string.split(target, "/")[2]
			local depName = split:gsub("_", "-")

			local depFile = joinAsFile {
				`local TS = _G[script.Parent.Parent.lib]`,
				`return TS.import(script.Parent.Parent.lib, TS.getModule(script.Parent.Parent.lib, "@rbxts", "{depName}").{if depName
						== "vide"
					then "src"
					else "dist"})`,
			}

			packageFiles[name] = depFile
		end
	end
	for name, file in packageFiles do
		fs.writeFile(robloxPackagesDir .. "/" .. name .. ".luau", file)
	end
end

type SortItem = {
	name: string,
	path: string,
	dependencies: { [string]: PesdeDependency }?,
}

local function get_order()
	local packages = fs.readDir "./pkgs"
	local package_dependencies: { SortItem } = {}
	local mapped: { [string]: PesdeToml } = {}

	for index, package in packages do
		if package:find "_foreign" then continue end
		local path = "./pkgs/" .. package
		local file = fs.readFile(path .. "/pesde.toml")
		local pesde_toml: PesdeToml = serde.decode("toml", file)

		mapped[pesde_toml.name] = pesde_toml
		package_dependencies[index] = {
			name = pesde_toml.name,
			path = path,
			dependencies = pesde_toml.dependencies,
		}
	end

	-- check if a relies on b
	local function flatten_dependencies(dependencies: { [string]: any })
		local flat = {}

		for name, dependency in dependencies do
			if dependency.workspace then
				local toml = mapped[dependency.workspace]
				if toml.dependencies == nil then continue end
				for name in flatten_dependencies(toml.dependencies) do
					flat[name] = true
				end
			elseif not dependency.wally then
				error(`bad dependency {name}`)
			end

			flat[dependency.workspace or dependency.wally] = true
		end

		return flat
	end

	local function relies_on(a: SortItem, b: SortItem)
		if a.dependencies == nil then return false end
		local flattened = flatten_dependencies(a.dependencies)
		return flattened[b.name] or false
	end

	table.sort(package_dependencies, function(a: SortItem, b: SortItem)
		if a.dependencies == nil and b.dependencies == nil then
			return a.name > b.name
		end
		if a.dependencies == nil then return true end
		if b.dependencies == nil then return false end

		if relies_on(a, b) then return false end
		if relies_on(b, a) then return true end

		return a.name > b.name
	end)

	local order = {}

	for index, item in package_dependencies do
		order[index] = item.path
	end

	return order
end

local function main()
	local order = get_order()

	for _, pkg in order do
		if pkg:find "conch_standalone" then continue end
		buildPackage(pkg)
	end
end

main()
